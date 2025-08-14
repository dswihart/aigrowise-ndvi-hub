### **Section 11: Deployment Architecture**

A continuous deployment pipeline using GitHub Actions will automate deployments to a DigitalOcean Droplet on every push to the `main` branch. The Droplet will run the application using PM2 and serve it securely via an Nginx reverse proxy.

***
