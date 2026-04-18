With the system metrics handled, the next question was: how do I monitor each Docker container individually?

Docker runs a daemon in the background that manages all your containers. That daemon exposes a full REST API — the same API that the `docker` CLI uses. Every time you run `docker ps` or `docker stats`, the CLI is just making HTTP requests to this API under the hood.

The difference is *where* that API lives. Instead of listening on a TCP port, it listens on a Unix socket at `/var/run/docker.sock`. A Unix socket works like a network connection, but between processes on the same machine — no network stack involved, faster, and more secure since it's not reachable from the outside.

To talk to it from Node.js, you make a standard HTTP request but tell it to use the socket path instead of a hostname and port. No Docker SDK needed, no libraries — just Node's built-in `http` module pointed at a different kind of address.

The collector hits two Docker API endpoints:

**`/containers/json`** returns a list of all containers with their status, names, image info, and when they were created. This is the equivalent of `docker ps`.

**`/containers/{id}/stats?stream=false`** returns a single stats snapshot for a specific container — CPU usage, memory consumption, network I/O, and more. The `stream=false` parameter is important: without it, Docker keeps the connection open and streams stats continuously, which isn't what we want for a polling-based collector.

To make this work, the Docker socket is mounted into the dashboard container via `docker-compose.yml`:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

This gives the dashboard container the ability to query (and potentially control) Docker on the host. It's a powerful capability and a real security consideration — the dashboard can see every container on the system.
