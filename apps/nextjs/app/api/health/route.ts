import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const timestamp = new Date().toISOString();
  const checks = {
    database: false,
    storage: false,
  };

  try {
    // Database connectivity check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
    }

    // Storage configuration check
    try {
      const hasStorageConfig = !!(
        process.env.DO_SPACES_ACCESS_KEY && 
        process.env.DO_SPACES_SECRET_KEY &&
        process.env.DO_SPACES_BUCKET
      );
      checks.storage = hasStorageConfig;
    } catch (storageError) {
      console.error('Storage health check failed:', storageError);
    }

    // Determine overall status
    const allChecksPass = Object.values(checks).every(check => check === true);
    const status = allChecksPass ? "healthy" : "degraded";
    const httpStatus = allChecksPass ? 200 : 503;

    return NextResponse.json({
      status,
      timestamp,
      version: "1.0.0",
      service: "Aigrowise NDVI Hub",
      environment: process.env.NODE_ENV || "development",
      checks,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      }
    }, { status: httpStatus });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: "error",
        timestamp,
        service: "Aigrowise NDVI Hub",
        error: "Service unavailable",
        checks
      },
      { status: 503 }
    );
  }
}