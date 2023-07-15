import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript2';

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
        ],
        input: ['src/index.ts'],
        output: [
            {
                dir: 'build/',
                format: 'cjs',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
            },
        ],
        external: [],
    });

    return builds;
}
