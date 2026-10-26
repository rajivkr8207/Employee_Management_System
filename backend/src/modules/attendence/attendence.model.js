import mongoose from "mongoose";
const attendanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    checkInLocation: {
      lat: Number,
      lng: Number,
    },

    checkOutLocation: {
      lat: Number,
      lng: Number,
    },

    source: {
      type: String,
      enum: ["self", "manual"],
      default: "self",
    },

    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    correctionReason: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day"],
      default: "present",
    },
  },
  { timestamps: true }
);

// Ek employee ka ek store mein ek din ka attendance record
attendanceSchema.index(
  { employeeId: 1, date: 1 },
  { unique: true }
);

export const AttendanceModel = mongoose.model("Attendance", attendanceSchema);
