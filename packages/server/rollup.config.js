import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import uglify from 'rollup-plugin-uglify';

export default async function ({ watch }) {
    const builds = [];

    // Main
    builds.push({
        plugins: [
            typescript({
                typescript: require('typescript'),
            }),
            resolve({
                mainFields: ['main'],
            }),
            commonjs(),
            replace({
                exclude: 'node_modules/**',
                ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
            }),
            process.env.NODE_ENV === 'production' && uglify(),
        ],
        input: ['src/index.ts'],
        output: [
            {
                dir: 'build/esm/',
                format: 'esm',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
            },
            {
                dir: 'build/cjs/',
                format: 'cjs',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
            },
        ],
        external: [],
    });

    return builds;
}
