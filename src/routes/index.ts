import { Router } from "express";
import authRoutes from "./authRoutes.js";
// import sessionRoutes from "./sessionRoutes.js";
// import bookingRoutes from "./bookingRoutes.js";
// import adminUserRoutes from "./adminUserRoutes.js";
// import adminSanctionRoutes from "./adminSanctionRoutes.js";
// import adminPricingRoutes from "./adminPricingRoutes.js";
// import adminRequestRoutes from "./adminRequestRoutes.js";
import sessionTypeRoutes from "./sessionTypeRoutes.js";
// import coachRoutes from "./coachRoutes.js";
// import membershipRoutes from "./membershipRoutes.js";
// import preferenceRoutes from "./preferenceRoutes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
// routes.use("/sessions", sessionRoutes);
// routes.use("/bookings", bookingRoutes);
// routes.use("/admin/users", adminUserRoutes);
// routes.use("/admin/sanctions", adminSanctionRoutes);
// routes.use("/admin/pricing", adminPricingRoutes);
// routes.use("/admin/requests", adminRequestRoutes);
routes.use("/session-types", sessionTypeRoutes);
// routes.use("/coach", coachRoutes);
// routes.use("/memberships", membershipRoutes);
// routes.use("/preferences", preferenceRoutes);
