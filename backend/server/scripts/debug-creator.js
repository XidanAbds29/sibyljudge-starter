require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCreator() {
  console.log("=== Debugging Contest Creator Issue ===\n");
  
  try {
    // 1. Check contest_creation table
    console.log("1. Checking contest_creation table...");
    const { data: creationData, error: creationError } = await supabase
      .from("contest_creation")
      .select("*");
    
    if (creationError) {
      console.log("   Error:", creationError);
    } else {
      console.log(`   Found ${creationData.length} records in contest_creation:`);
      creationData.forEach(record => {
        console.log(`   - Contest ${record.contest_id} created by ${record.created_by}`);
      });
    }
    
    // 2. Check specific contest (contest_id = 6)
    console.log("\n2. Checking contest_id = 6 specifically...");
    const { data: contest6Creation, error: contest6Error } = await supabase
      .from("contest_creation")
      .select("*")
      .eq("contest_id", 6)
      .single();
    
    if (contest6Error) {
      console.log("   Error:", contest6Error);
      console.log("   This explains why creator shows as 'Unknown' - no record in contest_creation");
    } else {
      console.log("   Found record:", contest6Creation);
      
      // 3. If we found the record, check the profiles table
      if (contest6Creation.created_by) {
        console.log("\n3. Checking profiles table for created_by UUID...");
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", contest6Creation.created_by)
          .single();
        
        if (profileError) {
          console.log("   Error:", profileError);
        } else {
          console.log("   Found profile:", profileData);
        }
      }
    }
    
    // 4. Check profiles table structure
    console.log("\n4. Checking profiles table structure...");
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(3);
    
    if (profilesError) {
      console.log("   Error:", profilesError);
    } else {
      console.log(`   Found ${profilesData.length} sample profiles:`);
      profilesData.forEach(profile => {
        console.log(`   - ID: ${profile.id}, Username: ${profile.username}`);
      });
    }
    
    // 5. Check contest table
    console.log("\n5. Checking contest table for contest_id = 6...");
    const { data: contestData, error: contestError } = await supabase
      .from("contest")
      .select("*")
      .eq("contest_id", 6)
      .single();
    
    if (contestError) {
      console.log("   Error:", contestError);
    } else {
      console.log("   Contest data:", contestData);
    }
    
  } catch (error) {
    console.error("Debug script error:", error);
  }
  
  console.log("\n=== Debug Complete ===");
}

debugCreator();
