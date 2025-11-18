import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Local Strategy for username/password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.password) {
          return done(null, false, { message: 'Please use Google sign-in for this account' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// JWT Strategy for token-based authentication
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-jwt-secret',
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (user) {
        return done(null, user);
      }

      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy (optional)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (!user) {
            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: profile.emails?.[0]?.value },
            });

            if (existingUser) {
              // Link Google account to existing user
              user = await prisma.user.update({
                where: { id: existingUser.id },
                data: { googleId: profile.id },
              });
            } else {
              // Create new user
              user = await prisma.user.create({
                data: {
                  googleId: profile.id,
                  email: profile.emails?.[0]?.value || '',
                  username: profile.emails?.[0]?.value?.split('@')[0] || `user_${Date.now()}`,
                  fullName: profile.displayName || 'User',
                  avatar: profile.photos?.[0]?.value,
                },
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
