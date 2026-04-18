When you're running multiple apps on a single VPS, you need to know what's happening on that machine. Is the CPU spiking? Is a container eating all the RAM? Did Nginx stop responding?

I could have installed Grafana, Prometheus, or any number of off-the-shelf monitoring tools. But that would have defeated the purpose. I wanted to understand *how* monitoring actually works — where the numbers come from, how they get from the kernel to a chart on a screen, and what it takes to build something real-time.

So I built my own dashboard from scratch. No frameworks, no monitoring libraries. Just Node.js talking directly to the Linux kernel, the Docker Engine, and Nginx — then streaming it all to a browser over WebSockets.

It lives at [admin.zacharystocks.com](https://admin.zacharystocks.com) and monitors the very server it runs on.
