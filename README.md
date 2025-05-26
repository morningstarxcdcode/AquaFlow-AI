# AquaFlow AI

A React and Vite-based fluid simulation project enhanced with AI capabilities, delivering interactive and visually stunning fluid dynamics simulations in a modern web environment.

## Project Structure

```
/src
  /components       # React components (FluidSimulation, ControlPanel, Header, etc.)
  /context          # React context providers (AuthContext, SimulationContext)
  /fluid            # Fluid simulation logic and shaders
  /utils            # Utility functions (audio, supabase client, etc.)
/supabase           # Supabase backend related files and migrations
.github/workflows   # GitHub Actions workflows for CI/CD
dist                # Production build output (generated after build)
/node_modules       # Project dependencies
package.json        # Project metadata and scripts
vite.config.ts      # Vite build configuration
README.md           # Project documentation
.gitignore          # Files and folders ignored by git
...

## Author

This project was delivered by morningstarxcdcode.

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm (comes with Node.js)

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Build

Build the project for production:

```bash
npm run build
```

The build output will be in the `dist` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

### Deployment

You can deploy the contents of the `dist` directory to any static hosting service such as GitHub Pages, Netlify, Vercel, or your own server.

### How to Contribute

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes and commit them with clear messages.
4. Push your branch to your forked repository.
5. Open a pull request describing your changes.

### Customizing the Project

To customize or fork this project:

- Clone your forked repository.
- Modify the source code in the `src` directory as needed.
- Update dependencies in `package.json` if required.
- Test your changes locally using the development server.
- Build and deploy your customized version following the build and deployment steps.

### GitHub Deployment

To deploy this project to GitHub:

1. Create a new repository on GitHub.
2. Initialize git in your project folder if not already done:

```bash
git init
```

3. Add the remote repository:

```bash
git remote add origin https://github.com/your-username/your-repo.git
```

4. Add files and commit:

```bash
git add .
git commit -m "Initial commit"
```

5. Push to GitHub:

```bash
git branch -M main
git push -u origin main
```

Replace `your-username` and `your-repo` with your GitHub username and repository name.

---

If you want to automate build and deployment on GitHub using GitHub Actions, please let me know.

npm run dev
