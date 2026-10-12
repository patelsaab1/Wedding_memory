import mongoose from 'mongoose';

/**
 * Refresh token sessions with rotation support.
 * Stores only a hash of the refresh token — never the raw token.
 */
const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByHash: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    ip: {
      type: String,
      trim: true,
      maxlength: 64,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

refreshSessionSchema.index({ tokenHash: 1 }, { unique: true });
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSession =
  mongoose.models.RefreshSession || mongoose.model('RefreshSession', refreshSessionSchema);
