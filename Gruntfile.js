/* jslint node: true */
'use strict';

var _ = require( 'lodash' );

module.exports = function( grunt ) {

	var tasks = {
		templates: ['assemble'],
		styles : ['scsslint', 'sass', 'cssmin'],
		scripts: ['uglify', 'jscs'],
		configs: ['copy']
	}

	var brands = ['brand1', 'brand2', 'brand3'];

	// We need some objects to assign later
	var sass = {};
	var cssMin = {};
	var stripMq = {};
	var assemble = {};
	var copy = {};

	// Loop over our brands creating cases for each brand
	_.forEach( brands, function( brand ) {

		var brandConfig = grunt.file.readJSON( 'src/configs/' + brand + '/brand.json' );

		// Built the necessary options for grunt
		sass['dist/' + brand + '/css/main.min.css'] = 'src/styles/' + brand + '/default.scss';
		cssMin[ 'dist/' + brand + '/css/main.min.css' ] = 'dist/' + brand + '/css/main.min.css';
		stripMq['dist/' + brand + '/css/main.nomedia.css'] = 'dist/' + brand + '/css/main.min.css';
		assemble[ brand + 'Pages' ] = {
			options: {
				layout: '_main.hbs',
				config: brandConfig,
			},
			src: ['src/pages/*.hbs'],
			dest: 'dist/' + brand + '/templates/',
		};
		assemble[ brand + 'Partials' ] = {
			options: {
				config: brandConfig,
			},
			src: 'src/partials/*.hbs',
			dest: 'dist/' + brand + '/templates/',
		};
		copy[brand + 'Config'] = {
			src: 'src/configs/' + brand + '/config.json',
			dest: 'dist/' + brand + '/config.json'
		};

	} );

	// Get the configObject together ready to send to Grunt
	var configObject = {
		tasks: tasks,
		watch: {
			templates: {
				files: ['src/pages/*.hbs', 'src/partials/*.hbs', 'src/layouts/*.hbs', 'src/configs/*.json'],
				tasks: '<%= tasks.templates %>',
			},
			styles: {
				files: 'src/styles/**/*',
				tasks: '<%= tasks.styles %>',
			},
			scripts: {
				files: 'src/scripts/**/*.js',
				tasks: '<%= tasks.scripts %>',
			},
			configs: {
				files: ['src/configs/*.json', 'src/configs/**/config.json'],
				tasks: '<%= tasks.configs %>',
			}
		},
		scsslint: {
			options: {
				colorizeOutput: true,
				config: '.scss-lint.yml',
				maxBuffer: 'false',
				force: true
			},
			allFiles: [
				'src/styles/**/*.scss',
				'src/styles/**/branding/*.scss',
				'!src/styles/structure/vendor/*.scss'
			]
		},
		sass: {
			options: {
				sourcemap: 'none'
			},
			dist: {
				files: sass
			}
		},
		cssmin: {
			combine: {
				files: cssMin
			}
		},
		stripmq: {
			options: {
				width: 1000,
				type: 'screen',
			},
			responsive: {
				files: stripMq
			}
		},
		assemble: {
			options: {
				partials: 'src/partials/*.hbs',
				flatten: true,
				ext: '.dust',
				layoutdir: 'src/layouts',
			}
		},
		uglify: {
			options: {
				beautify: true
			}
		},
		jscs: {
			options: {
				config: 'codeGuidlines.jscs.json',
				force: 'true'
			},
			src: ['src/scripts/**/*.js', '!src/scripts/vendor/**']
		}
	}

	// Have to put uglify in after, because of it's lay out
	_.forEach( brands, function( brand ) {
		configObject.uglify[brand] = {};
		configObject.uglify[brand].files = {};
		configObject.uglify[brand].files['dist/' + brand + '/js/general.min.js'] = ['src/scripts/core/availability.js', 'src/scripts/core/payment.js'];
	} );

	// Adding unusual cases to the configObject before it gets passed to the initConfig
	assemble.options = configObject.assemble.options;
	configObject.assemble = assemble;
	configObject.copy = copy;

	// project configuration
	grunt.initConfig( configObject );

	// Template stuff
	grunt.loadNpmTasks( 'assemble' );
	grunt.task.registerTask( 'templates', tasks.templates );

	// Styles stuff
	grunt.loadNpmTasks( 'grunt-scss-lint' );
	grunt.loadNpmTasks( 'grunt-contrib-sass' );
	grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-stripmq' );
	grunt.task.registerTask( 'styles', tasks.styles );

	// Scripts stuff
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-jscs' );
	grunt.task.registerTask( 'scripts', tasks.scripts );

	// Config stuff
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.task.registerTask( 'configs', tasks.configs );

	// Big time compile
	grunt.registerTask( 'massCompile', 'Mass compile task is used by NPM on install & deploy task', function() {
		grunt.task.run( [ 'styles', 'templates', 'scripts', 'configs' ] );
	} );

	grunt.task.registerTask( 'test', ['scsslint', 'jscs'] );

};