import mongoose from 'mongoose';
import { STORAGE_CONNECTION_STATUS, STORAGE_PROVIDERS } from '@wedding-memory/shared';

/**
 * Safe storage provider metadata only.
 * NEVER store access keys, client secrets, refresh tokens, or service account JSON here.
 */
const storageConnectionSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: Object.values(STORAGE_PROVIDERS),
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: Object.values(STORAGE_CONNECTION_STATUS),
      default: STORAGE_CONNECTION_STATUS.DISCONNECTED,
    },
    /** Public-safe identifiers only (folder id, bucket name — not credentials). */
    externalRef: {
      type: String,
      trim: true,
      default: null,
    },
    rootPath: {
      type: String,
      trim: true,
      default: null,
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    lastErrorCode: {
      type: String,
      trim: true,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

storageConnectionSchema.index({ provider: 1, label: 1 }, { unique: true });
storageConnectionSchema.index({ provider: 1, isDefault: 1 });

export const StorageConnection =
  mongoose.models.StorageConnection || mongoose.model('StorageConnection', storageConnectionSchema);
