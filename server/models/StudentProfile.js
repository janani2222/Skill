const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    collegeName: {
      type: String,
      default: 'College Institute of Engineering & Technology',
      trim: true,
    },
    degree: {
      type: String,
      default: 'Bachelor of Technology (B.Tech)',
      trim: true,
    },
    graduationYear: {
      type: String,
      default: '2027',
      trim: true,
    },
    location: {
      type: String,
      default: 'Chennai, Tamil Nadu',
      trim: true,
    },
    aboutMe: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    socialLinks: {
      github: {
        type: String,
        default: '',
        trim: true,
      },
      linkedin: {
        type: String,
        default: '',
        trim: true,
      },
      portfolio: {
        type: String,
        default: '',
        trim: true,
      },
    },
    completionPercentage: {
      type: Number,
      default: 25,
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate completion percentage dynamically
studentProfileSchema.methods.calculateCompletion = function () {
  let percentage = 25; // Base for user registration details (name, email, department, year)

  if (this.aboutMe && this.aboutMe.trim().length > 10) {
    percentage += 20;
  }
  if (this.skills && this.skills.length > 0) {
    percentage += 20;
  }
  if (this.interests && this.interests.length > 0) {
    percentage += 15;
  }
  if (
    this.socialLinks &&
    (this.socialLinks.github || this.socialLinks.linkedin || this.socialLinks.portfolio)
  ) {
    percentage += 10;
  }
  if (this.avatar && this.avatar.trim().length > 0) {
    percentage += 10;
  }

  this.completionPercentage = Math.min(percentage, 100);
  return this.completionPercentage;
};

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
