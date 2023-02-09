import { findDelta, findNewValueFromDelta, generatePositionalRef, mergeKeysOfObjects, mergeMissingValues, valueType } from '../src/utils';

describe('test generatePositionalRef', () => {
    test('case 1', () => {
        const originalArr = [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
            { id: 3, name: 'c' },
            { id: 4, name: 'd' },
        ];

        const addedElement = [
            { id: 2, name: 'b' },
            { id: 4, name: 'd' },
        ];

        const ref = generatePositionalRef(originalArr, addedElement, 'id');
        expect(ref).toEqual([
            { id: 2, name: 'b', pRef: 1 },
            { id: 4, name: 'd', pRef: 3 },
        ]);
    });
});

describe('merge missing values of two objects', () => {
    test('test 1', () => {
        const obj1 = {
            a: 1,
            b: 2,
            c: 3,
        };
        const obj2 = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
        };

        const { old_data, new_data } = mergeMissingValues(obj1, obj2);
        expect(old_data).toEqual({
            a: 1,
            b: 2,
            c: 3,
            d: 4,
        });

        expect(new_data).toEqual({
            a: 1,
            b: 2,
            c: 3,
            d: 4,
        });
    });
});

describe('stabilize the keys of two object', () => {
    test('test 1', () => {
        const prevObj = { a: 1, b: 2, c: 3 };
        const nextObj = { a: 1, b: 2, c: 3, d: 4 };

        const { old_data, new_data } = mergeKeysOfObjects(prevObj, nextObj);

        expect(old_data).toEqual({ a: 1, b: 2, c: 3, d: null });
        expect(new_data).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    test('test 2', () => {
        // nested old object
        const prevObj = { a: 1, b: 2, c: { d: 1, e: 2 } };
        const nextObj = { a: 1, b: 2, c: { d: 1, e: 2, f: 3 } };

        const { old_data, new_data } = mergeKeysOfObjects(prevObj, nextObj);

        expect(old_data).toEqual({ a: 1, b: 2, c: { d: 1, e: 2 } });
        expect(new_data).toEqual({ a: 1, b: 2, c: { d: 1, e: 2, f: 3 } });
    });
});

describe('test delta function', () => {
    // delta function for primitive types
    test('delta functions for primitive', () => {
        const prevValue = 11;
        const newValue = 12;

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual(12);
    });

    test('delta function for simple object', async () => {
        const prevValue = { id: 1, name: 'Harry', age: 20 };
        const newValue = { id: 1, name: 'Harry', age: 21 };

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual({ age: 21 });
    });

    test('delta function for nested object', async () => {
        const prevValue = { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } };
        const newValue = { id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } };

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual({ age: 21 });
    });

    test('delta function for nested object', async () => {
        const prevValue = { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } };
        const newValue = { id: 1, name: 'Harry', age: 21, address: { city: 'America', country: 'UK' } };

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual({ age: 21, address: { city: 'America' } });
    });

    test('delta function for rows', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20 },
            { id: 2, name: 'John', age: 30 },
        ];
        const newValue = [
            { id: 1, name: 'Harry', age: 21 },
            { id: 2, name: 'John', age: 30 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual([{ id: 1, nr: false, age: 21 }]);
    });

    test('delta function for array with nested object inside object', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];
        const newValue = [
            { id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual([{ id: 1, nr: false, age: 21 }]);
    });

    test('delta function for array with nested object inside object', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];
        const newValue = [
            { id: 1, name: 'Harry', age: 21, address: { city: 'America', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual([{ id: 1, nr: false, age: 21, address: { city: 'America' } }]);
    });

    test('delta for no change', async () => {
        const prevValue = { id: 1, name: 'John', age: 30 };
        const newValue = { id: 1, name: 'John', age: 30 };

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual({});
    });

    test('new row added', async () => {
        const prevValue: any[] = [{ id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } }];
        const newValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual([{ id: 2, nr: true, pRef: 1, name: 'John', age: 30 }]);
    });

    test('new row added', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20 },
            { id: 2, name: 'John', age: 30 },
        ];
        const newValue = [
            { id: 1, name: 'Harry', age: 21 },
            { id: 2, name: 'John', age: 30 },
            { id: 3, name: 'Peter', age: 40 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');

        expect(delta).toEqual([
            { id: 3, name: 'Peter', age: 40, nr: true, pRef: 2 },
            { id: 1, age: 21, nr: false },
        ]);
    });

    test('element get deleted from the old array', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20 },
            { id: 2, name: 'John', age: 30 },
        ];
        const newValue = [{ id: 1, name: 'Harry', age: 20 }];

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual([{ id: 2, dr: true }]);
    });

    test('all elements get deleted from the old array', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20 },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue: any = [];

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual([
            { id: 1, dr: true },
            { id: 2, dr: true },
        ]);
    });

    test('element get deleted and element get updated', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20 },
            { id: 2, name: 'John', age: 30 },
        ];
        const newValue = [{ id: 1, name: 'Harry', age: 21 }];

        const delta = findDelta(prevValue, newValue, 'id');
        expect(delta).toEqual([
            { id: 2, dr: true },
            { id: 1, nr: false, age: 21 },
        ]);
    });
});

describe('test new object maker from delta and old value', () => {
    test('element get updated deep nesting', async () => {
        const prevValue = { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } };
        const newValue = { id: 1, name: 'Harry', age: 21, address: { city: 'America', country: 'UK' } };

        const delta = findDelta(prevValue, newValue, 'id');
        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    test('prev no value then new value', async () => {
        const prevValue = null;
        const newValue = { id: 1, name: 'Harry', age: 21, address: { city: 'America', country: 'UK' } };

        const delta = findDelta(prevValue, newValue, 'id');
        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    test('prev no value then new value arr', async () => {
        const prevValue: any[] = [];
        const newValue = [{ id: 1, name: 'Harry', age: 21, address: { city: 'America', country: 'UK' } }];

        const delta = findDelta(prevValue, newValue, 'id');
        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    test('element get updated', async () => {
        const prevValue = { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } };
        const newValue = { id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } };

        const delta = findDelta(prevValue, newValue, 'id');
        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    test('pure array', async () => {
        const prevValue = [1, 2, 3, 4, 5];
        const newValue = [1, 2, 3, 4, 5];

        const delta = findDelta(prevValue, newValue, 'id');
        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);

        const prevValue2 = [1, 2, 3, 4, 5];
        const newValue2 = [1, 2, 3, 4, 6];

        const delta2 = findDelta(prevValue2, newValue2, 'id');
        const finalValue2 = findNewValueFromDelta(prevValue2, delta2, 'id');
        expect(finalValue2).toEqual(newValue2);

        const prevValue3 = [1, 2, 3, 4, 5];
        const newValue3 = [1, 2, 3, 4, 5, 6];

        const delta3 = findDelta(prevValue3, newValue3, 'id');
        const finalValue3 = findNewValueFromDelta(prevValue3, delta3, 'id');
        expect(finalValue3).toEqual(newValue3);
    });

    test('case 4', async () => {
        const prevValue = { id: 1, name: 'Harry', progress: [1, 2, 3, 4], age: 20, address: { city: 'London', country: 'UK' } };
        const newValue = { id: 1, name: 'Harry', progress: [1, 2, 3, 4, 5], age: 21, address: { city: 'Patna', country: 'India' } };

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    test('case 5', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue = [
            { id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    test('case 6', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue = [{ id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } }];

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    test('handle new row addition', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue = [
            { id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
            { id: 3, name: 'Peter', age: 40 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    test('handle all row deleted', async () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue: any = [];

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');

        expect(finalValue).toEqual(newValue);
    });

    test('handle new row added at top', () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue = [
            { id: 3, name: 'Peter', age: 40 },
            { id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    // handle new row added in the middle of the old array
    test('handle new row added in the middle of the old array', () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue = [
            { id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } },
            { id: 3, name: 'Peter', age: 40 },
            { id: 2, name: 'John', age: 30 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    // handle new row added to the top and element deleted from the bottom
    test('handle new row added to the top and element deleted from the bottom', () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue = [
            { id: 3, name: 'Peter', age: 40 },
            { id: 1, name: 'Harry', age: 21, address: { city: 'London', country: 'UK' } },
        ];

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    // handle new element added in the middle and element deleted from the top
    test('handle new element added in the middle and element deleted from the top', () => {
        const prevValue = [
            { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
            { id: 2, name: 'John', age: 30 },
        ];

        const newValue = [
            { id: 4, name: 'Merry', age: 45 },
            { id: 3, name: 'Peter', age: 40 },
            { id: 2, name: 'John', age: 30 },
        ];

        const delta = findDelta(prevValue, newValue, 'id');

        const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
        expect(finalValue).toEqual(newValue);
    });

    // handle reorder of the rows 
    // test('handle reorder of the rows', () => {
    //     const prevValue = [
    //         { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
    //         { id: 2, name: 'John', age: 30 },
    //     ];

    //     const newValue = [
    //         { id: 2, name: 'John', age: 30 },
    //         { id: 1, name: 'Harry', age: 20, address: { city: 'London', country: 'UK' } },
    //     ];

    //     const delta = findDelta(prevValue, newValue, 'id');

    //     const finalValue = findNewValueFromDelta(prevValue, delta, 'id');
    //     expect(finalValue).toEqual(newValue);
    // });
});

// test the value type checker
describe('value type checker', () => {
    test('array type', () => {
        const arr = [1, 2, 3];
        const type = valueType(arr);
        expect(type).toEqual('array');
    });

    // test object
    test('object type', () => {
        const obj = { a: 1, b: 2 };
        const type = valueType(obj);
        expect(type).toEqual('object');
    });

    // test primitive
    test('primitive type', () => {
        const prim = 'string';
        const type = valueType(prim);
        expect(type).toEqual('primitive');
    });

    // test array type with nested array
    test('array type with nested array', () => {
        const arr = [1, 2, [3, 4]];
        const type = valueType(arr);
        expect(type).toEqual('array');
    });

    // test array type with nested object
    test('array type with nested object', () => {
        const arr = [1, 2, { a: 1, b: 2 }];
        const type = valueType(arr);
        expect(type).toEqual('array');
    });

    // test object type with nested array
    test('object type with nested array', () => {
        const obj = { a: 1, b: 2, c: [3, 4] };
        const type = valueType(obj);
        expect(type).toEqual('object');
    });

    // test object type with nested object
    test('object type with nested object', () => {
        const obj = { a: 1, b: 2, c: { a: 1, b: 2 } };
        const type = valueType(obj);
        expect(type).toEqual('object');
    });

    // test object type with nested array and object
    test('object type with nested array and object', () => {
        const obj = { a: 1, b: 2, c: [3, 4, { a: 1, b: 2 }] };
        const type = valueType(obj);
        expect(type).toEqual('object');
    });

    // test object type with nested object and array
    test('object type with nested object and array', () => {
        const obj = { a: 1, b: 2, c: { a: 1, b: 2 }, d: [3, 4] };
        const type = valueType(obj);
        expect(type).toEqual('object');
    });
});
