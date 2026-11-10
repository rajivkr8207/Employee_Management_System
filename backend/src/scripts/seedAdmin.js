import { ConnectDB } from '../config/database.js';
import { bootstrapInitialAdmin } from '../utils/bootstrapAdmin.js';
import Config from '../config/config.js';
import mongoose from 'mongoose';

// Parse command line arguments like --email=xyz --password=abc
const parseArgs = () => {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key && value) args[key] = value;
    }
  }
  return args;
};

const run = async () => {
  const args = parseArgs();
  console.log('Connecting to database...');
  await ConnectDB();

  const email = args.email || Config.initial_admin_email;
  const username = args.username || Config.initial_admin_username;
  const password = args.password || Config.initial_admin_password;
  const fullName = args.name || Config.initial_admin_name;

  console.log(`Bootstrapping admin account (${email})...`);
  const result = await bootstrapInitialAdmin({ email, username, password, fullName });

  if (result.created) {
    console.log('\n=============================================');
    console.log('🎉 System Admin created successfully!');
    console.log(`   Email:    ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('   Role:     admin');
    console.log('=============================================\n');
  } else if (result.promoted) {
    console.log(`User ${email} was promoted to Admin.`);
  } else {
    console.log(`Notice: ${result.message || 'Admin already exists'}.`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});

