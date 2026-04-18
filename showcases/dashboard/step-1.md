Linux exposes system information through `/proc`, a pseudo-filesystem that doesn't exist on disk — it's generated on the fly by the kernel. Every file in `/proc` is a window into what the system is doing right now.

The dashboard reads from four sources:

**`/proc/stat` for CPU usage.** This file contains cumulative CPU time counters measured in "jiffies" (typically 1/100th of a second). The counters track how much time the CPU has spent in different states: user processes, system calls, idle, waiting on I/O, and more. Since the numbers are cumulative, you can't just read them once — you need two readings and calculate the delta to get a percentage. The collector takes a baseline reading, waits, then takes another and computes the difference.

**`/proc/meminfo` for RAM.** This gives you total memory, free memory, available memory, buffers, and cache. One important insight: `MemFree` looks alarmingly low on healthy Linux systems because the kernel aggressively uses free RAM for file caching. `MemAvailable` is the number that actually tells you how much memory is usable.

**`/proc/loadavg` for system load.** Three numbers representing the 1, 5, and 15-minute load averages. The collector normalizes these against the CPU core count so you can tell at a glance whether the system is overloaded — a load of 2.0 on a 2-core machine means something very different than 2.0 on an 8-core machine.

**`df` for disk usage.** Disk stats aren't cleanly exposed in `/proc`, so this is the one place the collector shells out to an external command. It filters out virtual filesystems so you only see real storage.

Since the dashboard runs inside a Docker container, the host's `/proc` is mounted read-only into the container at `/host/proc`. The path is configurable via an environment variable so the same code works both in development and in production.
