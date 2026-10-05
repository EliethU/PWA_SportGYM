#!/usr/bin/env node

/**
 * Herramienta de estadísticas para escanear proyectos
 * Analiza archivos, líneas de código, estructuras y métricas
 */

const fs = require('fs');
const path = require('path');

class ProjectScanner {
  constructor(rootPath = '.') {
    this.rootPath = path.resolve(rootPath);
    this.stats = {
      totalFiles: 0,
      totalLines: 0,
      totalSize: 0,
      filesByExtension: {},
      filesByDirectory: {},
      largestFiles: [],
      extensionsToCount: ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md']
    };
  }

  /**
   * Inicia el escaneo del proyecto
   */
  scan() {
    console.log(`🔍 Escaneando proyecto: ${this.rootPath}\n`);
    this.scanDirectory(this.rootPath);
    this.generateReport();
  }

  /**
   * Escanea un directorio recursivamente
   */
  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        // Ignorar directorios específicos
        if (stat.isDirectory()) {
          if (this.shouldIgnoreDirectory(item)) {
            continue;
          }
          this.scanDirectory(fullPath);
        } else if (stat.isFile()) {
          this.analyzeFile(fullPath, stat);
        }
      }
    } catch (error) {
      // Ignorar errores de permisos
    }
  }

  /**
   * Determina si un directorio debe ser ignorado
   */
  shouldIgnoreDirectory(dirName) {
    const ignoreDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '.nyc_output',
      '.agents',
      'spec'
    ];
    return ignoreDirs.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * Analiza un archivo individual
   */
  analyzeFile(filePath, stat) {
    const ext = path.extname(filePath);
    const relativePath = path.relative(this.rootPath, filePath);
    const dirName = path.dirname(relativePath);

    this.stats.totalFiles++;
    this.stats.totalSize += stat.size;

    // Contar por extensión
    if (this.stats.extensionsToCount.includes(ext)) {
      this.stats.filesByExtension[ext] = (this.stats.filesByExtension[ext] || 0) + 1;
    }

    // Contar por directorio
    this.stats.filesByDirectory[dirName] = (this.stats.filesByDirectory[dirName] || 0) + 1;

    // Contar líneas de código para archivos de código
    if (this.stats.extensionsToCount.includes(ext)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        this.stats.totalLines += lines;

        // Agregar a los archivos más grandes (por líneas)
        this.stats.largestFiles.push({
          path: relativePath,
          lines: lines,
          size: stat.size
        });
      } catch (error) {
        // Ignorar errores de lectura
      }
    }
  }

  /**
   * Genera y muestra el reporte de estadísticas
   */
  generateReport() {
    console.log('📊 ESTADÍSTICAS DEL PROYECTO\n');
    console.log('═'.repeat(50));

    // Resumen general
    console.log('\n📁 RESUMEN GENERAL');
    console.log('─'.repeat(50));
    console.log(`Total de archivos:       ${this.stats.totalFiles}`);
    console.log(`Total de líneas de código: ${this.stats.totalLines}`);
    console.log(`Tamaño total:             ${this.formatBytes(this.stats.totalSize)}`);

    // Archivos por extensión
    console.log('\n📄 ARCHIVOS POR EXTENSIÓN');
    console.log('─'.repeat(50));
    const sortedExtensions = Object.entries(this.stats.filesByExtension)
      .sort((a, b) => b[1] - a[1]);

    for (const [ext, count] of sortedExtensions) {
      const percentage = ((count / this.stats.totalFiles) * 100).toFixed(1);
      console.log(`${ext.padEnd(10)} ${count.toString().padStart(5)} (${percentage}%)`);
    }

    // Archivos por directorio (top 10)
    console.log('\n📂 ARCHIVOS POR DIRECTORIO (Top 10)');
    console.log('─'.repeat(50));
    const sortedDirs = Object.entries(this.stats.filesByDirectory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [dir, count] of sortedDirs) {
      console.log(`${dir.padEnd(40)} ${count}`);
    }

    // Archivos más grandes (por líneas, top 10)
    console.log('\n📈 ARCHIVOS MÁS GRANDES (por líneas - Top 10)');
    console.log('─'.repeat(50));
    this.stats.largestFiles
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10)
      .forEach((file, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${file.path}`);
        console.log(`   ${file.lines} líneas | ${this.formatBytes(file.size)}`);
      });

    // Promedios
    console.log('\n📊 PROMEDIOS');
    console.log('─'.repeat(50));
    const avgLinesPerFile = this.stats.totalFiles > 0 
      ? (this.stats.totalLines / this.stats.totalFiles).toFixed(1) 
      : 0;
    const avgSizePerFile = this.stats.totalFiles > 0 
      ? this.formatBytes(this.stats.totalSize / this.stats.totalFiles) 
      : '0 B';
    console.log(`Líneas promedio por archivo: ${avgLinesPerFile}`);
    console.log(`Tamaño promedio por archivo: ${avgSizePerFile}`);

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Escaneo completado\n');
  }

  /**
   * Formatea bytes a formato legible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Ejecutar el escaneo
const args = process.argv.slice(2);
const targetPath = args[0] || '.';

const scanner = new ProjectScanner(targetPath);
scanner.scan();
