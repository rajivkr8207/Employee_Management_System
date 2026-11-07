import { api } from "../../../lib/api";

const createAttendanceForm = (organizationId, location, image) => {
  const form = new FormData();
  form.append("organizationId", organizationId);
  form.append("lat", String(location.lat));
  form.append("lng", String(location.lng));
  form.append("image", image, "face.jpg");
  return form;
};

export const attendanceService = {
  getToday: (organizationId, location) =>
    api.get("/attendance/today", {
      params: {
        organizationId,
        ...(location ? { lat: location.lat, lng: location.lng } : {}),
      },
    }),
  getMine: (params) => api.get("/attendance/mine", { params }),
  getRecords: (params) => api.get("/attendance", { params }),
  checkIn: (organizationId, location, image) =>
    api.post("/attendance/check-in", createAttendanceForm(organizationId, location, image), {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  checkOut: (organizationId, location, image) =>
    api.post("/attendance/check-out", createAttendanceForm(organizationId, location, image), {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  enrollFace: (image) => {
    const form = new FormData();
    form.append("image", image, "face.jpg");
    return api.post("/auth/face/enroll", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
