const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const USERS_TO_SEED = [
  { email: 'admin@sibyljudge.com', password: 'AdminPassword123!', username: 'admin', isAdmin: true },
  { email: 'coder_pro@sibyljudge.com', password: 'CoderPassword123!', username: 'coder_pro', isAdmin: false },
  { email: 'algo_master@sibyljudge.com', password: 'AlgoPassword123!', username: 'algo_master', isAdmin: false },
  { email: 'vjudge_bot@sibyljudge.com', password: 'BotPassword123!', username: 'vjudge_bot', isAdmin: false }
];

async function seed() {
  try {
    console.log('🚀 Starting Database Seeding Process...');

    // 1. Create/Retrieve Users
    console.log('\n--- Step 1: Provisioning Users ---');
    const userMap = {}; // Maps username to user ID
    
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw listErr;
    const existingUsers = listData.users || [];

    for (const spec of USERS_TO_SEED) {
      let user = existingUsers.find(u => u.email === spec.email);
      let userId;

      if (user) {
        userId = user.id;
        console.log(`User ${spec.email} already exists with ID: ${userId}`);
      } else {
        console.log(`Creating user ${spec.email}...`);
        const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
          email: spec.email,
          password: spec.password,
          email_confirm: true,
          user_metadata: { username: spec.username }
        });
        if (createErr) throw createErr;
        userId = createData.user.id;
        console.log(`Successfully created user: ${spec.email} (ID: ${userId})`);
      }
      userMap[spec.username] = userId;
    }

    // Wait for the PostgreSQL trigger to finish inserting profile records
    console.log('Waiting 2 seconds for profiles triggers to execute...');
    await new Promise(r => setTimeout(r, 2000));

    // Update admin status in profiles
    console.log('Ensuring admin flags are updated in profiles...');
    for (const spec of USERS_TO_SEED) {
      if (spec.isAdmin) {
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', userMap[spec.username]);
        if (updErr) console.error(`Failed to set admin profile status: ${updErr.message}`);
        else console.log(`Set is_admin=true for user "${spec.username}"`);
      }
    }

    const adminId = userMap['admin'];
    const coderProId = userMap['coder_pro'];
    const algoMasterId = userMap['algo_master'];

    // 2. Fetch problems and tags
    console.log('\n--- Step 2: Fetching Existing Problems & Tags ---');
    const { data: problems, error: pErr } = await supabase
      .from('Problem')
      .select('problem_id, title, difficulty');
    if (pErr) throw pErr;
    console.log(`Loaded ${problems.length} problems from database.`);

    const { data: tags, error: tErr } = await supabase
      .from('Tag')
      .select('*');
    if (tErr) throw tErr;
    console.log(`Loaded ${tags.length} tags from database.`);

    if (problems.length === 0) {
      console.log('⚠️ No problems found in DB! Please run codeforces_scraper.py first to seed problems.');
      process.exit(0);
    }

    // 3. Seed Contests
    console.log('\n--- Step 3: Seeding Contests & Contest Problems ---');
    const contestSpecs = [
      {
        name: 'Futuristic Coding Challenge #1',
        description: 'Test your tactical thinking and algorithm design in our weekly training run.',
        difficulty: 'Medium',
        durationHours: 3,
        offsetHours: 0 // starts now
      },
      {
        name: 'Algorithm Blitz (Beginner)',
        description: 'Perfect sandbox for newly registered agents to hone their skills.',
        difficulty: 'Easy',
        durationHours: 2,
        offsetHours: -1 // started an hour ago
      }
    ];

    for (const spec of contestSpecs) {
      const { data: existingContest } = await supabase
        .from('contest')
        .select('contest_id')
        .eq('name', spec.name);

      let contestId;
      if (existingContest && existingContest.length > 0) {
        contestId = existingContest[0].contest_id;
        console.log(`Contest "${spec.name}" already exists (ID: ${contestId}).`);
      } else {
        const startTime = new Date(Date.now() + spec.offsetHours * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + spec.durationHours * 60 * 60 * 1000);

        const { data: newContest, error: cErr } = await supabase
          .from('contest')
          .insert({
            name: spec.name,
            description: spec.description,
            difficulty: spec.difficulty,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_secured: false,
            is_virtual: false
          })
          .select('contest_id')
          .single();

        if (cErr) {
          console.error(`Failed to create contest "${spec.name}":`, cErr.message);
          continue;
        }
        contestId = newContest.contest_id;
        console.log(`Created contest "${spec.name}" (ID: ${contestId})`);

        // Record creation by admin
        await supabase.from('contest_creation').insert({
          created_by: adminId,
          contest_id: contestId
        });

        // Link 3 problems
        const shuffledProblems = [...problems].sort(() => 0.5 - Math.random());
        const selected = shuffledProblems.slice(0, 3);
        const aliases = ['A', 'B', 'C'];
        
        for (let i = 0; i < selected.length; i++) {
          await supabase.from('contest_problem').insert({
            contest_id: contestId,
            problem_id: selected[i].problem_id,
            alias: aliases[i]
          });
          console.log(`Linked problem "${selected[i].title}" to contest ${spec.name} as alias ${aliases[i]}`);
        }
      }
    }

    // 4. Seed Tracks & Track Problems (Tag-based curriculum)
    console.log('\n--- Step 4: Seeding Training Tracks ---');
    const { data: problemTags, error: ptErr } = await supabase
      .from('Problem_tag')
      .select('problem_id, Tag(name, tag_id)');
    if (ptErr) throw ptErr;

    const tagToProblems = {};
    for (const pt of problemTags) {
      if (pt.Tag) {
        const tagName = pt.Tag.name;
        if (!tagToProblems[tagName]) tagToProblems[tagName] = [];
        tagToProblems[tagName].push(pt.problem_id);
      }
    }

    const popularTags = Object.keys(tagToProblems).filter(name => tagToProblems[name].length >= 3);
    console.log('Popular tags for tracks:', popularTags);

    for (const tagName of popularTags) {
      const trackName = `${tagName.charAt(0).toUpperCase() + tagName.slice(1)} Mastery Track`;
      const description = `Practice essential competitive programming problems categorized under the "${tagName}" tag. Enhance your problem-solving skills step-by-step.`;

      const { data: existingTrack } = await supabase
        .from('track')
        .select('track_id')
        .eq('name', trackName);

      let trackId;
      if (existingTrack && existingTrack.length > 0) {
        trackId = existingTrack[0].track_id;
        console.log(`Track "${trackName}" already exists (ID: ${trackId}).`);
      } else {
        const { data: newTrack, error: tErr } = await supabase
          .from('track')
          .insert({
            name: trackName,
            description: description,
            created_by: adminId
          })
          .select('track_id')
          .single();

        if (tErr) {
          console.error(`Failed to create track "${trackName}":`, tErr.message);
          continue;
        }
        trackId = newTrack.track_id;
        console.log(`Created track "${trackName}" (ID: ${trackId})`);

        const pids = tagToProblems[tagName];
        let ord = 1;
        for (const pid of pids) {
          await supabase.from('track_problem').insert({
            track_id: trackId,
            problem_id: pid,
            ordinal: ord++,
            uploaded_by: adminId
          });
        }
        console.log(`Linked ${pids.length} problems to track "${trackName}"`);
      }
    }

    // 5. Seed Discussions (threads and posts)
    console.log('\n--- Step 5: Seeding Discussions ---');
    const discussions = [
      {
        title: 'Welcome to SibylJudge Mainframe!',
        type: 'general',
        createdBy: adminId,
        posts: [
          { userId: adminId, content: 'Welcome operatives! This is your control terminal. Explore problems, form groups, and participate in contests to synchronize your systems.' },
          { userId: coderProId, content: 'The user interface is stellar! Love the responsive cyberpunk theme and GSAP load animations.' },
          { userId: algoMasterId, content: 'Initialization successful. Excited to debug, optimize, and submit solutions directly here.' }
        ]
      },
      {
        title: 'Tips for mastering Dynamic Programming?',
        type: 'general',
        createdBy: coderProId,
        posts: [
          { userId: coderProId, content: 'I struggle with state definitions in complex dynamic programming problems. Any suggestions or recommended tracks here?' },
          { userId: algoMasterId, content: 'Start with the DP Mastery Track! Define the subproblems first, then write down the recurrence relations. Drawing state-transition tables on paper helps a lot.' }
        ]
      }
    ];

    for (const d of discussions) {
      const { data: existingThread } = await supabase
        .from('discussion_thread')
        .select('dissthread_id')
        .eq('title', d.title);

      let threadId;
      if (existingThread && existingThread.length > 0) {
        threadId = existingThread[0].dissthread_id;
        console.log(`Thread "${d.title}" already exists (ID: ${threadId}).`);
      } else {
        const { data: newThread, error: thErr } = await supabase
          .from('discussion_thread')
          .insert({
            title: d.title,
            thread_type: d.type,
            created_by: d.createdBy
          })
          .select('dissthread_id')
          .single();

        if (thErr) {
          console.error(`Failed to create thread "${d.title}":`, thErr.message);
          continue;
        }
        threadId = newThread.dissthread_id;
        console.log(`Created thread "${d.title}" (ID: ${threadId})`);

        for (const p of d.posts) {
          await supabase.from('discussion_post').insert({
            dissthread_id: threadId,
            user_id: p.userId,
            content: p.content
          });
        }
        console.log(`Seeded ${d.posts.length} posts for thread "${d.title}"`);
      }
    }

    // 6. Seed Submissions
    console.log('\n--- Step 6: Seeding Submissions ---');
    const submissionSpecs = [
      {
        userId: coderProId,
        problemId: problems[0].problem_id,
        language: 'cpp',
        status: 'Accepted',
        execTime: 120.0,
        memTaken: 2048.0,
        code: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if(cin >> n) {\n        cout << n * 2 << endl;\n    }\n    return 0;\n}`
      },
      {
        userId: algoMasterId,
        problemId: problems[Math.min(1, problems.length - 1)].problem_id,
        language: 'python',
        status: 'Wrong Answer',
        execTime: 65.0,
        memTaken: 4096.0,
        code: `n = int(input())\nprint(n + 1) # WA attempt`
      },
      {
        userId: algoMasterId,
        problemId: problems[Math.min(1, problems.length - 1)].problem_id,
        language: 'python',
        status: 'Accepted',
        execTime: 42.0,
        memTaken: 4120.0,
        code: `n = int(input())\nprint(n * 2) # AC solution`
      },
      {
        userId: coderProId,
        problemId: problems[Math.min(2, problems.length - 1)].problem_id,
        language: 'java',
        status: 'Time Limit Exceeded',
        execTime: 2050.0,
        memTaken: 24500.0,
        code: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner s = new Scanner(System.in);\n        while(true) {} // TLE attempt\n    }\n}`
      }
    ];

    for (const sub of submissionSpecs) {
      // Create a submission
      const { data: newSub, error: subErr } = await supabase
        .from('submission')
        .insert({
          user_id: sub.userId,
          problem_id: sub.problemId,
          language: sub.language,
          status: sub.status,
          exec_time: sub.execTime,
          mem_taken: sub.memTaken,
          solution_code: sub.code
        })
        .select('submission_id')
        .single();

      if (subErr) {
        console.error(`Failed to insert submission for problem ${sub.problemId}:`, subErr.message);
      } else {
        console.log(`Seeded submission (ID: ${newSub.submissionId}) for problem ${sub.problemId} with status ${sub.status}`);
      }
    }

    console.log('\n✅ Seeding process completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed with error:', err.message || err);
    process.exit(1);
  }
}

seed();
