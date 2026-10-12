import mongoose from 'mongoose';
import { MEDIA_TYPES, STORAGE_PROVIDERS, VISIBILITY } from '@wedding-memory/shared';

const thumbnailSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    providerFileId: { type: String, trim: true },
    storageKey: { type: String, trim: true },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
  },
  { _id: false },
);

const mediaSchema = new mongoose.Schema(
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
    albumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
      default: null,
      index: true,
    },
    mediaType: {
      type: String,
      enum: Object.values(MEDIA_TYPES),
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    thumbnail: {
      type: thumbnailSchema,
      default: undefined,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

mediaSchema.index({ provider: 1 });
mediaSchema.index({ providerFileId: 1 });
mediaSchema.index({ mediaType: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ albumId: 1, createdAt: -1 });
mediaSchema.index({ provider: 1, providerFileId: 1 });

export const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);
