import mongoose from 'mongoose';
import { ALBUM_CATEGORIES } from '@wedding-memory/shared';

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 220,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    coverMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
    category: {
      type: String,
      enum: Object.values(ALBUM_CATEGORIES),
      default: ALBUM_CATEGORIES.WEDDING,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

albumSchema.index({ slug: 1 }, { unique: true });
albumSchema.index({ sortOrder: 1 });
albumSchema.index({ isPublished: 1, sortOrder: 1 });

export const Album = mongoose.models.Album || mongoose.model('Album', albumSchema);
