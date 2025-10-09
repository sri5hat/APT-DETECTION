#!/bin/bash

# Start the Next.js development server in the background
npm run dev &

# Wait a few seconds for the Next.js server to start
sleep 5

# Start the Python agent
cd python_agent
python3 apt_agent.py