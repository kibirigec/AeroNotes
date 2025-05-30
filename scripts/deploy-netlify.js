#!/usr/bin/env node

/**
 * Netlify Deployment Script
 * Runs production checks and deploys to Netlify
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class NetlifyDeployer {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Check if required files exist
  checkRequiredFiles() {
    console.log('🔍 Checking required files...');
    
    const requiredFiles = [
      'netlify.toml',
      '.env.production.example',
      'package.json'
    ];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.errors.push(`Missing required file: ${file}`);
      }
    });

    if (fs.existsSync('.env.production')) {
      console.log('✅ .env.production found');
    } else {
      this.warnings.push('⚠️  .env.production not found - you\'ll need to set environment variables in Netlify dashboard');
    }
  }

  // Run production readiness check
  async runProductionCheck() {
    console.log('🔍 Running production readiness check...');
    
    return new Promise((resolve) => {
      exec('npm run prepare-production', (error, stdout, stderr) => {
        if (stdout.includes('No critical issues found')) {
          console.log('✅ Production readiness check passed');
        } else {
          this.warnings.push('⚠️  Production readiness issues found - run "npm run prepare-production" for details');
        }
        resolve();
      });
    });
  }

  // Check if Netlify CLI is installed
  async checkNetlifyCLI() {
    console.log('🔍 Checking Netlify CLI...');
    
    return new Promise((resolve) => {
      exec('netlify --version', (error, stdout, stderr) => {
        if (error) {
          this.warnings.push('⚠️  Netlify CLI not found - install with: npm install -g netlify-cli');
        } else {
          console.log(`✅ Netlify CLI found: ${stdout.trim()}`);
        }
        resolve();
      });
    });
  }

  // Build the application
  async buildApp() {
    console.log('🏗️  Building application...');
    
    return new Promise((resolve, reject) => {
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          this.errors.push(`Build failed: ${error.message}`);
          reject(error);
        } else {
          console.log('✅ Build completed successfully');
          resolve();
        }
      });
    });
  }

  // Deploy to Netlify
  async deployToNetlify(production = false) {
    const deployType = production ? 'production' : 'preview';
    const command = production ? 'netlify deploy --prod' : 'netlify deploy';
    
    console.log(`🚀 Deploying to Netlify (${deployType})...`);
    
    return new Promise((resolve, reject) => {
      const deployProcess = exec(command, (error, stdout, stderr) => {
        if (error) {
          this.errors.push(`Deployment failed: ${error.message}`);
          reject(error);
        } else {
          console.log('✅ Deployment completed successfully');
          console.log(stdout);
          resolve();
        }
      });

      // Stream output in real-time
      deployProcess.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      
      deployProcess.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }

  // Display summary
  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }
    
    if (this.errors.length === 0) {
      console.log('🎉 Deployment process completed!');
      console.log('');
      console.log('📝 Next steps:');
      console.log('1. Check your Netlify dashboard for deployment status');
      console.log('2. Set up environment variables in Netlify if not done already');
      console.log('3. Test your deployment thoroughly');
      console.log('4. Configure custom domain if needed');
    } else {
      console.log('❌ Deployment failed. Please fix the errors above and try again.');
    }
  }

  // Main deployment function
  async deploy(production = false) {
    console.log('🚀 Starting Netlify deployment process...\n');
    
    try {
      this.checkRequiredFiles();
      await this.runProductionCheck();
      await this.checkNetlifyCLI();
      
      if (this.errors.length > 0) {
        this.displaySummary();
        return;
      }
      
      await this.buildApp();
      await this.deployToNetlify(production);
      
    } catch (error) {
      console.error('❌ Deployment process failed:', error.message);
    }
    
    this.displaySummary();
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const production = args.includes('--prod') || args.includes('--production');
  
  const deployer = new NetlifyDeployer();
  deployer.deploy(production).catch(console.error);
}

module.exports = NetlifyDeployer; 