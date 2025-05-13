const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { UnauthenticatedError } = require("../errors");

const initPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0].value;
          const firstName = profile.name?.givenName || "";
          const lastName = profile.name?.familyName || "";
          const picture = profile.photos && profile.photos[0]?.value;

          if (!email) {
            return done(
              new UnauthenticatedError("Email not found in Google profile"),
              null
            );
          }

          return done(null, {
            id: profile.id,
            email: email.toLowerCase(),
            firstName,
            lastName,
            picture,
          });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

module.exports = initPassport;
