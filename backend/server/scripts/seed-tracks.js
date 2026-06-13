const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  try {
    console.log('Fetching users/profiles...');
    const { data: profiles, error: userErr } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (userErr) {
      console.error('Error fetching profiles:', userErr.message);
      process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
      console.log('========================================================================');
      console.log('No registered users found in "profiles" table.');
      console.log('Please register/sign up a user first in the UI, then run this seed script!');
      console.log('========================================================================');
      process.exit(0);
    }

    const userId = profiles[0].id;
    console.log(`Using user ID for track owner: ${userId}`);

    console.log('Fetching problems and tags...');
    // Get problems
    const { data: problems, error: pErr } = await supabase
      .from('Problem')
      .select('problem_id, title, difficulty');

    if (pErr) {
      console.error('Error fetching problems:', pErr.message);
      process.exit(1);
    }

    // Get problem tags
    const { data: problemTags, error: ptErr } = await supabase
      .from('Problem_tag')
      .select('problem_id, Tag(name, tag_id)');

    if (ptErr) {
      console.error('Error fetching problem tags:', ptErr.message);
      process.exit(1);
    }

    console.log(`Loaded ${problems.length} problems and ${problemTags.length} tags relations.`);

    // Group problem IDs by tag name
    const tagToProblems = {};
    const tagIdMap = {};

    for (const pt of problemTags) {
      if (pt.Tag) {
        const tagName = pt.Tag.name;
        const tagId = pt.Tag.tag_id;
        tagIdMap[tagName] = tagId;
        if (!tagToProblems[tagName]) {
          tagToProblems[tagName] = [];
        }
        tagToProblems[tagName].push(pt.problem_id);
      }
    }

    // Filter tags that have at least 3 problems to make quality tracks
    const popularTags = Object.keys(tagToProblems).filter(name => tagToProblems[name].length >= 3);
    console.log('Found popular tags for tracks:', popularTags);

    for (const tagName of popularTags) {
      const trackName = `${tagName.charAt(0).toUpperCase() + tagName.slice(1)} Mastery Track`;
      const description = `Practice essential competitive programming problems categorized under the "${tagName}" tag. Enhance your problem-solving skills step-by-step.`;

      // Check if track already exists
      const { data: existingTrack } = await supabase
        .from('track')
        .select('track_id')
        .eq('name', trackName);

      let trackId;
      if (existingTrack && existingTrack.length > 0) {
        trackId = existingTrack[0].track_id;
        console.log(`Track "${trackName}" already exists (ID: ${trackId}).`);
      } else {
        // Insert track
        const { data: newTrack, error: tErr } = await supabase
          .from('track')
          .insert({
            name: trackName,
            description: description,
            created_by: userId
          })
          .select('track_id');

        if (tErr || !newTrack) {
          console.error(`Failed to create track "${trackName}":`, tErr?.message);
          continue;
        }
        trackId = newTrack[0].track_id;
        console.log(`Created track "${trackName}" with ID: ${trackId}`);
      }

      // Add problems to track_problem
      const problemIds = tagToProblems[tagName];
      let ordinal = 1;
      for (const pid of problemIds) {
        try {
          const { error: tpErr } = await supabase
            .from('track_problem')
            .insert({
              track_id: trackId,
              problem_id: pid,
              ordinal: ordinal++,
              uploaded_by: userId
            });

          if (tpErr) {
            if (tpErr.message.includes('duplicate key')) {
              // Ignore duplicate keys
            } else {
              console.error(`Error adding problem ${pid} to track ${trackId}:`, tpErr.message);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      console.log(`Seeded ${problemIds.length} problems into "${trackName}".`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (e) {
    console.error('Exception during seeding:', e);
    process.exit(1);
  }
}

seed();
