const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter your college email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    department: {
      type: String,
      required: [true, 'Please select your department'],
      enum: [
        'Computer Science and Engineering',
        'Artificial Intelligence and Data Science',
        'Information Technology',
        'Electronics and Communication Engineering',
        'Electrical and Electronics Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Other',
      ],
    },
    year: {
      type: String,
      required: [true, 'Please select your year of study'],
      enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year'],
    },
    role: {
      type: String,
      default: 'student',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user-entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
