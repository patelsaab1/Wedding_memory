import mongoose from 'mongoose';
import { STORAGE_PROVIDERS, VISIBILITY } from '@wedding-memory/shared';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    provider: {
      type: String,
      enum: Object.values(STORAGE_PROVIDERS),
      required: true,
    },
    providerFileId: {
      type: String,
      trim: true,
      default: null,
    },
    storageKey: {
      type: String,
      trim: true,
      default: null,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'general',
    },
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.PRIVATE,
    },
    isActive: {
      type: Boolean,
      default: true,
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

documentSchema.index({ category: 1, isActive: 1 });
documentSchema.index({ provider: 1, providerFileId: 1 });

export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
