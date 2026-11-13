const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'Web Development',
      enum: [
        'Web Development',
        'Mobile Applications',
        'Artificial Intelligence',
        'Machine Learning',
        'Cloud & DevOps',
        'Cybersecurity',
        'Internet of Things (IoT)',
        'Blockchain',
        'Data Science',
        'Other',
      ],
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    role: {
      type: String,
      default: 'Full Stack Developer',
      trim: true,
    },
    teamMembers: [
      {
        type: String,
        trim: true,
      },
    ],
    startDate: {
      type: String,
      default: '',
    },
    completionDate: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '3 months',
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
      default: 'In Progress',
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    thumbnail: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
      trim: true,
    },
    liveDemoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    media: [
      {
        filePath: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          default: '',
        },
        fileType: {
          type: String,
          enum: ['image', 'document', 'video'],
          default: 'image',
        },
        description: {
          type: String,
          default: '',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema);

