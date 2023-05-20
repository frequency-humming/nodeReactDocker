#!/bin/sh

# Get the hostname of the EC2 instance
HOSTNAME=$(curl -s http://169.254.169.254/latest/meta-data/hostname)

# Export the hostname as an environment variable
export HOSTNAME

# Then exec the container's main process (what's set as CMD in the Dockerfile).
exec "$@"
