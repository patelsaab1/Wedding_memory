import mongoose from 'mongoose';

const albumAccessSchema = new mongoose.Schema(
  {
    folderId: {
      type: String,
      required: true,
      trim: true,
    },
    secret: {
      type: Boolean,
      default: false,
    },
    memberIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = String(ret._id);
        ret.memberIds = (ret.memberIds || []).map((memberId) => String(memberId));
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

albumAccessSchema.index({ folderId: 1 }, { unique: true });
albumAccessSchema.index({ secret: 1 });

export const AlbumAccess = mongoose.models.AlbumAccess || mongoose.model('AlbumAccess', albumAccessSchema);
