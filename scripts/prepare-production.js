#!/usr/bin/env node

/**
 * Production Preparation Script
 * Scans codebase for production-readiness issues
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ProductionPreparer {
  constructor() {
    this.issues = [];
    this.srcDir = path.join(process.cwd(), 'src');
    this.libDir = path.join(process.cwd(), 'lib');
  }

  // Scan for console.log statements
  async scanConsoleStatements() {
    console.log('🔍 Scanning for console.log statements...');
    
    return new Promise((resolve, reject) => {
      exec('grep -r "console\\.log" src/ lib/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" -n', 
        (error, stdout, stderr) => {
          if (stdout) {
            const lines = stdout.trim().split('\n');
            this.issues.push({
              type: 'console-logs',
              count: lines.length,
              details: lines.slice(0, 10), // Show first 10
              message: `Found ${lines.length} console.log statements that should be replaced with environment-aware logging`
            });
          }
          resolve();
        });
    });
  }

  // Scan for TODO comments
  async scanTodoComments() {
    console.log('🔍 Scanning for TODO comments...');
    
    return new Promise((resolve, reject) => {
      exec('grep -r "TODO\\|FIXME" src/ lib/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" -n', 
        (error, stdout, stderr) => {
          if (stdout) {
            const lines = stdout.trim().split('\n');
            this.issues.push({
              type: 'todo-comments',
              count: lines.length,
              details: lines,
              message: `Found ${lines.length} TODO/FIXME comments that should be resolved`
            });
          }
          resolve();
        });
    });
  }

  // Check environment files
  checkEnvironmentFiles() {
    console.log('🔍 Checking environment configuration...');
    
    const envExample = path.join(process.cwd(), '.env.example');
    const envProduction = path.join(process.cwd(), '.env.production.example');
    
    if (!fs.existsSync(envExample)) {
      this.issues.push({
        type: 'missing-env',
        message: 'Missing .env.example file'
      });
    }
    
    if (!fs.existsSync(envProduction)) {
      this.issues.push({
        type: 'missing-env-prod',
        message: 'Missing .env.production.example file'
      });
    }
  }

  // Check package.json for production scripts
  checkPackageJson() {
    console.log('🔍 Checking package.json configuration...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!packageJson.scripts.build) {
        this.issues.push({
          type: 'missing-build-script',
          message: 'Missing build script in package.json'
        });
      }
      
      if (!packageJson.scripts.start) {
        this.issues.push({
          type: 'missing-start-script',
          message: 'Missing start script in package.json'
        });
      }
    }
  }

  // Check for hardcoded localhost URLs
  async scanHardcodedUrls() {
    console.log('🔍 Scanning for hardcoded localhost URLs...');
    
    return new Promise((resolve, reject) => {
      exec('grep -r "localhost\\|127\\.0\\.0\\.1" src/ lib/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" -n', 
        (error, stdout, stderr) => {
          if (stdout) {
            const lines = stdout.trim().split('\n');
            this.issues.push({
              type: 'hardcoded-urls',
              count: lines.length,
              details: lines,
              message: `Found ${lines.length} hardcoded localhost URLs that should use environment variables`
            });
          }
          resolve();
        });
    });
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 PRODUCTION READINESS REPORT');
    console.log('='.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('✅ No critical issues found! Your app looks ready for production.');
      return;
    }
    
    console.log(`❌ Found ${this.issues.length} categories of issues that need attention:\n`);
    
    this.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type.toUpperCase()}`);
      console.log(`   ${issue.message}`);
      
      if (issue.details && issue.details.length > 0) {
        console.log('   Examples:');
        issue.details.slice(0, 5).forEach(detail => {
          console.log(`   - ${detail}`);
        });
        if (issue.details.length > 5) {
          console.log(`   ... and ${issue.details.length - 5} more`);
        }
      }
      console.log('');
    });
    
    console.log('🚨 NEXT STEPS:');
    console.log('1. Review the PRODUCTION_CHECKLIST.md file');
    console.log('2. Fix all console.log statements using the new logger utility');
    console.log('3. Resolve or remove TODO comments');
    console.log('4. Replace hardcoded URLs with environment variables');
    console.log('5. Set up proper production environment configuration');
    
    console.log('\n📖 For detailed guidance, see:');
    console.log('- PRODUCTION_CHECKLIST.md');
    console.log('- .env.production.example');
    console.log('- lib/core/config/logging.config.js');
  }

  // Main scan function
  async scan() {
    console.log('🚀 Starting production readiness scan...\n');
    
    await this.scanConsoleStatements();
    await this.scanTodoComments();
    await this.scanHardcodedUrls();
    this.checkEnvironmentFiles();
    this.checkPackageJson();
    
    this.generateReport();
  }
}

// Run the scan
if (require.main === module) {
  const preparer = new ProductionPreparer();
  preparer.scan().catch(console.error);
}

module.exports = ProductionPreparer; 