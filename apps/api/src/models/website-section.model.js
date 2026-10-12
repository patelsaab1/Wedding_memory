import mongoose from 'mongoose';
import { WEBSITE_SECTION_TYPES } from '@wedding-memory/shared';

const websiteSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: Object.values(WEBSITE_SECTION_TYPES),
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    configuration: {
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

websiteSectionSchema.index({ key: 1 }, { unique: true });
websiteSectionSchema.index({ sortOrder: 1 });
websiteSectionSchema.index({ enabled: 1, sortOrder: 1 });

export const WebsiteSection =
  mongoose.models.WebsiteSection || mongoose.model('WebsiteSection', websiteSectionSchema);
