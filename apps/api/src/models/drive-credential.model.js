import mongoose from 'mongoose';
import { STORAGE_PROVIDERS } from '@wedding-memory/shared';

/**
 * Encrypted Google Drive refresh token for live deploys.
 * Ciphertext is never sent to React or written into API JSON.
 */
const driveCredentialSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: Object.values(STORAGE_PROVIDERS),
      required: true,
      unique: true,
    },
    ciphertext: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
    },
    updatedByEmail: {
      type: String,
      trim: true,
      default: null,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

export const DriveCredential =
  mongoose.models.DriveCredential || mongoose.model('DriveCredential', driveCredentialSchema);
