/**
 * ══════════════════════════════════════════════════════════════════════════════
 *   SYSTEM METRICS MONITOR (CPU, RAM, REDIS, DATABASE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Safe, read-only collector for system resources, Redis stats, and MongoDB
 * connection health. Never executes destructive queries or flushes caches.
 */

import os from 'os';
import Redis from 'ioredis';
import { CONFIG } from './config.js';

export class SystemMonitor {
  constructor() {
    this.samples = [];
    this.intervalId = null;
    this.redisClient = null;
    this.initialRedisInfo = null;
  }

  /**
   * Initialize safe connections for monitoring.
   */
  async init() {
    try {
      this.redisClient = new Redis({
        host: CONFIG.REDIS_HOST,
        port: CONFIG.REDIS_PORT,
        password: CONFIG.REDIS_PASSWORD,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });

      await this.redisClient.connect().catch(() => {
        // Redis optional - fall back gracefully
      });

      if (this.redisClient.status === 'ready') {
        this.initialRedisInfo = await this.getRedisStats();
      }
    } catch {
      this.redisClient = null;
    }
  }

  /**
   * Start polling every intervalMs (default 1000ms).
   */
  start(intervalMs = 1000) {
    this.samples = [];
    const poll = async () => {
      const sample = await this.captureSample();
      this.samples.push(sample);
    };

    // Immediate first sample
    poll();
    this.intervalId = setInterval(poll, intervalMs);
  }

  /**
   * Stop polling and return aggregated stats.
   */
  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    let finalRedis = null;
    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        finalRedis = await this.getRedisStats();
      } catch {
        // ignore
      }
      try {
        await this.redisClient.quit();
      } catch {
        // ignore
      }
    }

    return this.aggregate(finalRedis);
  }

  /**
   * Capture a single point-in-time sample.
   */
  async captureSample() {
    const timestamp = new Date().toISOString();

    // CPU calculation (system-wide)
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    const cpuPercent = totalTick > 0 ? Math.round(((totalTick - totalIdle) / totalTick) * 100) : 0;

    // RAM calculation
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const memPercent = Math.round((usedMemBytes / totalMemBytes) * 100);

    // Process memory
    const procMem = process.memoryUsage();

    // Redis snapshot
    let redisStats = null;
    if (this.redisClient && this.redisClient.status === 'ready') {
      redisStats = await this.getRedisStats();
    }

    return {
      timestamp,
      host: {
        platform: os.platform(),
        cpus: cpus.length,
        cpuUsagePercent: cpuPercent,
        totalRamMB: Math.round(totalMemBytes / (1024 * 1024)),
        usedRamMB: Math.round(usedMemBytes / (1024 * 1024)),
        ramUsagePercent: memPercent,
      },
      process: {
        rssMB: Math.round(procMem.rss / (1024 * 1024)),
        heapUsedMB: Math.round(procMem.heapUsed / (1024 * 1024)),
        heapTotalMB: Math.round(procMem.heapTotal / (1024 * 1024)),
      },
      redis: redisStats,
    };
  }

  /**
   * Extract key metrics from Redis INFO command.
   */
  async getRedisStats() {
    try {
      const rawInfo = await this.redisClient.info();
      const parsed = {};
      rawInfo.split('\r\n').forEach((line) => {
        if (line && !line.startsWith('#')) {
          const parts = line.split(':');
          if (parts.length === 2) {
            parsed[parts[0].trim()] = parts[1].trim();
          }
        }
      });

      const hits = Number(parsed.keyspace_hits) || 0;
      const misses = Number(parsed.keyspace_misses) || 0;
      const totalLookups = hits + misses;
      const hitRate = totalLookups > 0 ? Math.round((hits / totalLookups) * 100) : 0;

      return {
        connectedClients: Number(parsed.connected_clients) || 0,
        usedMemoryHuman: parsed.used_memory_human || '0B',
        peakMemoryHuman: parsed.used_memory_peak_human || '0B',
        usedMemoryBytes: Number(parsed.used_memory) || 0,
        totalCommandsProcessed: Number(parsed.total_commands_processed) || 0,
        keyspaceHits: hits,
        keyspaceMisses: misses,
        hitRatePercent: hitRate,
        evictedKeys: Number(parsed.evicted_keys) || 0,
        rejectedConnections: Number(parsed.rejected_connections) || 0,
        uptimeSeconds: Number(parsed.uptime_in_seconds) || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Compute aggregated metrics from all samples.
   */
  aggregate(finalRedis) {
    if (this.samples.length === 0) {
      return {
        samplesCount: 0,
        cpu: { avgPercent: 0, peakPercent: 0 },
        ram: { avgUsedMB: 0, peakUsedMB: 0, avgPercent: 0, peakPercent: 0 },
        redis: null,
        samples: [],
      };
    }

    let cpuSum = 0;
    let peakCpu = 0;
    let ramUsedSum = 0;
    let peakRamUsed = 0;
    let ramPercentSum = 0;
    let peakRamPercent = 0;

    this.samples.forEach((s) => {
      const cpu = s.host.cpuUsagePercent;
      cpuSum += cpu;
      if (cpu > peakCpu) peakCpu = cpu;

      const ramUsed = s.host.usedRamMB;
      ramUsedSum += ramUsed;
      if (ramUsed > peakRamUsed) peakRamUsed = ramUsed;

      const ramPercent = s.host.ramUsagePercent;
      ramPercentSum += ramPercent;
      if (ramPercent > peakRamPercent) peakRamPercent = ramPercent;
    });

    const count = this.samples.length;
    return {
      samplesCount: count,
      cpu: {
        avgPercent: Math.round(cpuSum / count),
        peakPercent: peakCpu,
      },
      ram: {
        avgUsedMB: Math.round(ramUsedSum / count),
        peakUsedMB: peakRamUsed,
        avgPercent: Math.round(ramPercentSum / count),
        peakPercent: peakRamPercent,
      },
      redis: finalRedis || (this.samples[this.samples.length - 1]?.redis ?? null),
      samples: this.samples,
    };
  }
}
