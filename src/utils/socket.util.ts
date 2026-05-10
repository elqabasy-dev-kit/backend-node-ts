/**
 * @file utils/socket.util.ts
 * @description Socket.io setup and utilities for real-time communication
 * @author Mahros ALQabasy <mahros.dev>
 */

import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../db";
import { Permission } from "../constants/permissions";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  /**
   * Socket.io Authentication Middleware
   */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      // Verify JWT
      const decoded: any = jwt.verify(token as string, config.auth.jwt.secret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.active || user.isDeleted) {
        return next(
          new Error("Authentication error: User not found or inactive"),
        );
      }

      const isAdmin = user.permissions.includes(Permission.SUPERUSER);


      if (!isAdmin) {
        return next(
          new Error("Authentication error: Insufficient permissions"),
        );
      }

      // Attach user to socket for later use
      (socket as any).user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log(`Authorized SOC connection: ${user.username} (${socket.id})`);

    // Automatically join the security alerts room
    socket.join("soc_alerts");

    socket.on("disconnect", () => {
      console.log(`SOC Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;

export const emitSecurityEvent = (event: any) => {
  if (io) {
    io.to("soc_alerts").emit("security_event", event);
  }
};
