import { PrismaClient, Role } from '@prisma/client';
import { AuthUtils } from '@/utils/auth';
import logger from '@/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seeding...');

  try {
    // Check database connection
    await prisma.$connect();
    logger.info('✅ Database connection established');
    // Create super admin user
    const superAdminPassword = await AuthUtils.hashPassword('SuperAdmin123!');
    const superAdmin = await prisma.user.upsert({
      where: { phoneNumber: '+1234567890' },
      update: {},
      create: {
        phoneNumber: '+1234567890',
        email: 'superadmin@quizapp.com',
        name: 'Super Administrator',
        password: superAdminPassword,
        role: Role.SUPER_ADMIN,
        approved: true
      }
    });

    logger.info(`✅ Super admin created: ${superAdmin.id}`);

    // Create global content creator
    const globalCreatorPassword = await AuthUtils.hashPassword('GlobalCreator123!');
    const globalCreator = await prisma.user.upsert({
      where: { phoneNumber: '+1234567891' },
      update: {},
      create: {
        phoneNumber: '+1234567891',
        email: 'globalcreator@quizapp.com',
        name: 'Global Content Creator',
        password: globalCreatorPassword,
        role: Role.GLOBAL_CONTENT_CREATOR,
        approved: true
      }
    });

    logger.info(`✅ Global content creator created: ${globalCreator.id}`);

    // Create sample institution
    const sampleInstitution = await prisma.institution.upsert({
      where: { id: 'sample-institution-id' },
      update: {},
      create: {
        id: 'sample-institution-id',
        name: 'Sample University',
        address: '123 Education Street, Learning City, LC 12345',
        approved: true,
        adminId: superAdmin.id
      }
    });

    logger.info(`✅ Sample institution created: ${sampleInstitution.id}`);

    // Create sample grade
    const sampleGrade = await prisma.grade.upsert({
      where: { id: 'sample-grade-id' },
      update: {},
      create: {
        id: 'sample-grade-id',
        name: 'Grade 10',
        institutionId: sampleInstitution.id
      }
    });

    logger.info(`✅ Sample grade created: ${sampleGrade.id}`);

    // Create sample subject
    const sampleSubject = await prisma.subject.upsert({
      where: { id: 'sample-subject-id' },
      update: {},
      create: {
        id: 'sample-subject-id',
        name: 'Mathematics',
        gradeId: sampleGrade.id
      }
    });

    logger.info(`✅ Sample subject created: ${sampleSubject.id}`);

    // Create sample admin
    const adminPassword = await AuthUtils.hashPassword('Admin123!');
    const sampleAdmin = await prisma.user.upsert({
      where: { phoneNumber: '+1234567892' },
      update: {},
      create: {
        phoneNumber: '+1234567892',
        email: 'admin@sampleuniversity.com',
        name: 'Sample University Admin',
        password: adminPassword,
        role: Role.ADMIN,
        institutionId: sampleInstitution.id,
        approved: true
      }
    });

    logger.info(`✅ Sample admin created: ${sampleAdmin.id}`);

    // Create sample teacher
    const teacherPassword = await AuthUtils.hashPassword('Teacher123!');
    const sampleTeacher = await prisma.user.upsert({
      where: { phoneNumber: '+1234567893' },
      update: {},
      create: {
        phoneNumber: '+1234567893',
        email: 'teacher@sampleuniversity.com',
        name: 'John Mathematics Teacher',
        password: teacherPassword,
        role: Role.TEACHER,
        institutionId: sampleInstitution.id,
        approved: true
      }
    });

    logger.info(`✅ Sample teacher created: ${sampleTeacher.id}`);

    // Create sample student
    const studentPassword = await AuthUtils.hashPassword('Student123!');
    const sampleStudent = await prisma.user.upsert({
      where: { phoneNumber: '+1234567894' },
      update: {},
      create: {
        phoneNumber: '+1234567894',
        email: 'student@sampleuniversity.com',
        name: 'Alice Student',
        password: studentPassword,
        role: Role.STUDENT,
        institutionId: sampleInstitution.id,
        approved: true
      }
    });

    logger.info(`✅ Sample student created: ${sampleStudent.id}`);

    // Create sample quiz
    const sampleQuiz = await prisma.quiz.upsert({
      where: { id: 'sample-quiz-id' },
      update: {},
      create: {
        id: 'sample-quiz-id',
        title: 'Introduction to Algebra',
        description: 'Basic algebraic concepts and problem solving',
        createdById: sampleTeacher.id,
        subjectId: sampleSubject.id,
        institutionId: sampleInstitution.id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        durationMins: 45,
        settings: {
          allowRetake: false,
          showResults: true,
          randomizeQuestions: false,
          timeLimit: true,
          passingScore: 70
        },
        isActive: false,
        isCompleted: false
      }
    });

    logger.info(`✅ Sample quiz created: ${sampleQuiz.id}`);

    // Create sample questions
    const sampleQuestions = await Promise.all([
      prisma.question.create({
        data: {
          quizId: sampleQuiz.id,
          text: 'What is the value of x in the equation 2x + 5 = 13?',
          options: ['3', '4', '5', '6'],
          answer: '4',
          difficulty: 'easy',
          points: 1
        }
      }),
      prisma.question.create({
        data: {
          quizId: sampleQuiz.id,
          text: 'Solve for y: 3y - 7 = 8',
          options: ['3', '4', '5', '6'],
          answer: '5',
          difficulty: 'medium',
          points: 2
        }
      }),
      prisma.question.create({
        data: {
          quizId: sampleQuiz.id,
          text: 'What is the slope of the line y = 2x + 3?',
          options: ['2', '3', '5', '6'],
          answer: '2',
          difficulty: 'easy',
          points: 1
        }
      })
    ]);

    logger.info(`✅ Sample questions created: ${sampleQuestions.length} questions`);

    // Link users to grades
    try {
      await prisma.grade.update({
        where: { id: sampleGrade.id },
        data: {
          students: {
            connect: { id: sampleStudent.id }
          },
          teachers: {
            connect: { id: sampleTeacher.id }
          }
        }
      });

      logger.info(`✅ Users linked to grades`);
    } catch (error) {
      logger.warn(`⚠️ Could not link users to grades: ${error}`);
    }

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('📋 Sample data created:');
    logger.info(`   - Super Admin: +1234567890 (SuperAdmin123!)`);
    logger.info(`   - Global Creator: +1234567891 (GlobalCreator123!)`);
    logger.info(`   - Sample University Admin: +1234567892 (Admin123!)`);
    logger.info(`   - Sample Teacher: +1234567893 (Teacher123!)`);
    logger.info(`   - Sample Student: +1234567894 (Student123!)`);
    logger.info(`   - Sample Institution: Sample University`);
    logger.info(`   - Sample Grade: Grade 10`);
    logger.info(`   - Sample Subject: Mathematics`);
    logger.info(`   - Sample Quiz: Introduction to Algebra (3 questions)`);

  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    logger.error('❌ Seeding error:', error);
    process.exit(1);
  });
