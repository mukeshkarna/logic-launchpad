import { PrismaClient, UserRole, UserStatus, BadgeType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin user
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123456';
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@bloghub.com' },
    update: {},
    create: {
      email: 'admin@bloghub.com',
      username: 'superadmin',
      password: hashedPassword,
      fullName: 'Super Admin',
      bio: 'Platform Administrator',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ Super Admin created:', {
    email: superAdmin.email,
    username: superAdmin.username,
    password: superAdminPassword,
  });

  // Create default platform settings
  const defaultSettings = [
    {
      key: 'site_name',
      value: '"BlogHub"',
      description: 'Platform name displayed across the site',
    },
    {
      key: 'site_description',
      value: '"A modern blogging platform for writers and readers"',
      description: 'Platform description for SEO',
    },
    {
      key: 'registration_enabled',
      value: 'true',
      description: 'Allow new user registrations',
    },
    {
      key: 'email_verification_required',
      value: 'false',
      description: 'Require email verification for new accounts',
    },
    {
      key: 'comment_moderation',
      value: '"auto_approve"',
      description: 'Comment moderation mode: auto_approve, review_all, or review_first',
    },
    {
      key: 'max_upload_size',
      value: '5242880',
      description: 'Maximum file upload size in bytes (default: 5MB)',
    },
    {
      key: 'featured_blogs_count',
      value: '5',
      description: 'Number of featured blogs to display on homepage',
    },
    {
      key: 'trending_algorithm',
      value: '"engagement"',
      description: 'Trending algorithm: views, engagement, or recent',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.platformSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Platform settings created');

  // Create default badges
  const badges = [
    {
      name: 'First Blog',
      badgeType: BadgeType.FIRST_BLOG,
      description: 'Published your first blog post',
      icon: '📝',
      criteria: JSON.stringify({ minBlogs: 1 }),
    },
    {
      name: '1K Views',
      badgeType: BadgeType.VIEWS_1K,
      description: 'Reached 1,000 total views',
      icon: '👀',
      criteria: JSON.stringify({ minViews: 1000 }),
    },
    {
      name: '10K Views',
      badgeType: BadgeType.VIEWS_10K,
      description: 'Reached 10,000 total views',
      icon: '🔥',
      criteria: JSON.stringify({ minViews: 10000 }),
    },
    {
      name: '100K Views',
      badgeType: BadgeType.VIEWS_100K,
      description: 'Reached 100,000 total views',
      icon: '⭐',
      criteria: JSON.stringify({ minViews: 100000 }),
    },
    {
      name: '100 Likes',
      badgeType: BadgeType.LIKES_100,
      description: 'Received 100 likes on your blogs',
      icon: '❤️',
      criteria: JSON.stringify({ minLikes: 100 }),
    },
    {
      name: '1K Likes',
      badgeType: BadgeType.LIKES_1K,
      description: 'Received 1,000 likes on your blogs',
      icon: '💖',
      criteria: JSON.stringify({ minLikes: 1000 }),
    },
    {
      name: 'Top Blogger',
      badgeType: BadgeType.TOP_BLOGGER,
      description: 'Featured in top 10 bloggers of the month',
      icon: '🏆',
      criteria: JSON.stringify({ topRank: 10, period: 'month' }),
    },
    {
      name: 'Consistent Publisher',
      badgeType: BadgeType.CONSISTENT_PUBLISHER,
      description: 'Published at least one blog per week for a month',
      icon: '📅',
      criteria: JSON.stringify({ minBlogsPerWeek: 1, duration: 'month' }),
    },
    {
      name: 'Rising Star',
      badgeType: BadgeType.RISING_STAR,
      description: 'New user with exceptional engagement',
      icon: '🌟',
      criteria: JSON.stringify({ accountAge: 30, minEngagement: 1000 }),
    },
    {
      name: 'One Year Anniversary',
      badgeType: BadgeType.YEAR_ANNIVERSARY,
      description: 'Been a member for one year',
      icon: '🎂',
      criteria: JSON.stringify({ accountAge: 365 }),
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { badgeType: badge.badgeType },
      update: {},
      create: badge,
    });
  }

  console.log('✅ Badges created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Super Admin Credentials:');
  console.log('   Email:', superAdmin.email);
  console.log('   Username:', superAdmin.username);
  console.log('   Password:', superAdminPassword);
  console.log('\n⚠️  Please change the super admin password after first login!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
