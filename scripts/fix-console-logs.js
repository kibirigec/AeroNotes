#!/usr/bin/env node

/**
 * Console.log Replacement Script
 * Automatically replaces console.log statements with proper logging
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ConsoleLogFixer {
  constructor() {
    this.replacements = 0;
    this.filesModified = [];
  }

  // Get all JS/TS files in src and lib directories
  getJavaScriptFiles() {
    const files = [];
    
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (/\.(js|jsx|ts|tsx)$/.test(item)) {
          files.push(fullPath);
        }
      });
    };
    
    scanDirectory('src');
    scanDirectory('lib');
    
    return files;
  }

  // Process a single file
  processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Check if file already imports logger
    const hasLoggerImport = content.includes('from \'../../lib/core/config/logging.config.js\'') ||
                           content.includes('from \'../lib/core/config/logging.config.js\'') ||
                           content.includes('from \'./lib/core/config/logging.config.js\'') ||
                           content.includes('require(\'../../lib/core/config/logging.config.js\')') ||
                           content.includes('require(\'../lib/core/config/logging.config.js\')') ||
                           content.includes('require(\'./lib/core/config/logging.config.js\')');

    // Find console.log statements
    const consoleLogRegex = /console\.log\s*\(/g;
    const matches = content.match(consoleLogRegex);
    
    if (matches && matches.length > 0) {
      // Determine the correct import path
      const relativePath = path.relative(path.dirname(filePath), 'lib/core/config/logging.config.js');
      const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
      
      // Add logger import if not present
      if (!hasLoggerImport) {
        // Find the best place to add the import
        const lines = newContent.split('\n');
        let insertIndex = 0;
        
        // Look for existing imports
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('import ') || lines[i].includes('require(')) {
            insertIndex = i + 1;
          } else if (lines[i].trim() === '' && insertIndex > 0) {
            break;
          }
        }
        
        const loggerImport = `import { Logger } from '${importPath}';`;
        lines.splice(insertIndex, 0, loggerImport);
        newContent = lines.join('\n');
        modified = true;
      }
      
      // Replace console.log with Logger.debug
      newContent = newContent.replace(/console\.log\s*\(/g, 'Logger.debug(');
      modified = true;
      this.replacements += matches.length;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent);
      this.filesModified.push(filePath);
      console.log(`✅ Fixed ${matches ? matches.length : 0} console.log statements in ${filePath}`);
    }
  }

  // Main processing function
  async process() {
    console.log('🔧 Starting console.log replacement...\n');
    
    const files = this.getJavaScriptFiles();
    console.log(`Found ${files.length} JavaScript/TypeScript files to process\n`);
    
    files.forEach(file => {
      try {
        this.processFile(file);
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPLACEMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Replaced ${this.replacements} console.log statements`);
    console.log(`📁 Modified ${this.filesModified.length} files`);
    
    if (this.filesModified.length > 0) {
      console.log('\n📝 Modified files:');
      this.filesModified.forEach(file => {
        console.log(`   - ${file}`);
      });
      
      console.log('\n🚨 IMPORTANT NOTES:');
      console.log('1. Review the changes to ensure they make sense');
      console.log('2. Test your application to ensure it still works');
      console.log('3. Some console.log statements might need different log levels:');
      console.log('   - Logger.info() for informational messages');
      console.log('   - Logger.warn() for warnings');
      console.log('   - Logger.error() for errors');
      console.log('   - Logger.debug() for debug information (default replacement)');
      console.log('4. Consider removing debug logs that are no longer needed');
    }
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new ConsoleLogFixer();
  fixer.process().catch(console.error);
}

module.exports = ConsoleLogFixer; 