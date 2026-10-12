import mongoose from 'mongoose';
import { PERMISSIONS, USER_ROLES } from '@wedding-memory/shared';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
      default: USER_ROLES.VIEWER,
    },
    /**
     * Optional wife-role permission subset (configurable access).
     * Ignored for other roles.
     */
    allowedPermissions: {
      type: [String],
      enum: Object.values(PERMISSIONS),
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /**
     * When set, login stops after this moment. Empty means the account does not expire.
     */
    accessExpiresAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
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
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
