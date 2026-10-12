import mongoose from 'mongoose';
import { SHARE_RESOURCE_TYPES } from '@wedding-memory/shared';

const shareLinkSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    resourceType: {
      type: String,
      enum: Object.values(SHARE_RESOURCE_TYPES),
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    permissions: {
      type: [String],
      default: ['view'],
    },
    isActive: {
      type: Boolean,
      default: true,
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
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

shareLinkSchema.index({ token: 1 }, { unique: true });
shareLinkSchema.index({ expiresAt: 1 });
shareLinkSchema.index({ resourceType: 1, resourceId: 1 });

export const ShareLink = mongoose.models.ShareLink || mongoose.model('ShareLink', shareLinkSchema);
