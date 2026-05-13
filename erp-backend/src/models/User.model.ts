import mongoose, { Document, Schema, CallbackError } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'accountant';
  businessId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['admin', 'staff', 'accountant'],
      default: 'admin',
    },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving — Mongoose v8: no `next` callback needed
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password as string, 12);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

export default mongoose.model<IUser>('User', UserSchema);
