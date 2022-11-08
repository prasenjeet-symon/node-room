## Welcome to NodeRoom Client package

This package is a client for NodeRoom server. It is used to call and subscribe to the nodes.

> Note: This package is not a standalone package. It is used in conjunction with NodeRoom server.

### Installation

```bash
npm install @noderoom/client
```

## Bootstrapping NodeRoom Client

```js
import { nodeRoomBootstrap } from "@noderoom/client";

nodeRoomBootstrap({
    canCache: true,
    defaultRoom: 'your default room',
    host: 'your host', // e.g. http://localhost:3000
    supportOffline: true,
});
```
To use the client, you need to bootstrap it first. You can pass the following options to bootstrap it.

| Option | Type | Description |
| --- | --- | --- |
| canCache | boolean | If true, nodeRoom client will subscribe to all the query nodes to listen for the changes. You can also control this behavior per node basis. |
| defaultRoom | string | The default room to connect to. |
| host | string | The host of the NodeRoom server. |
| supportOffline | boolean | If true, the client will support offline mode. |

> Note: Usually, you will bootstrap the client in the root component of your application.

---

## Calling a Node

```js
import { fetchNode } from "@noderoom/client";

const nodeName = "your node name";
const nodeArgs = {
    // your node arguments as key value pairs
};

// optional arguments
const nodeOptions = {
        canCache:true,
        roomName: 'your room name',
        paginationID: 'your pagination ID',
        waitForNodes: [],
        supportOffline: true,
}

const subscription = fetchNode(nodeName, nodeArgs , nodeOptions).subscribe((result) =>{
    // your code to handle the result
});
```

To call a node, you need to use the `fetchNode` function. It takes the following arguments.

| Argument | Type | Description | isRequired |
| --- | --- | --- | --- |
| nodeName | string | The name of the node to call. | true |
| nodeArgs | object | The arguments to pass to the node as key value pairs. | true |
| nodeOptions | object | The options to pass to the node as key value pairs. | false |

The `nodeOptions` object can have the following properties.

| Property | Type | Description | default |
| --- | --- | --- | --- |
| canCache | boolean | If true, nodeRoom client will subscribe to this node to listen for the changes. | defaultCanCache |
| roomName | string | The room to connect to. | defaultRoomName |
| paginationID | string | The pagination ID to use for pagination. | auto generated |
| waitForNodes | array | The nodes to wait for before calling the node. | empty array |
| supportOffline | boolean | If true, the client will support offline mode for this node | defaultSupportOffline |

The `fetchNode` function returns an `Observable` object. You can subscribe to it to get the result.

> Note: The `fetchNode` function will return the cached result if the node is already cached and `supportOffline` is true.

> Note: Subscribed nodes should be unsubscribed when they are not needed anymore. You can do this by calling the `unsubscribe` function on the `Subscription` object returned by fetchNode.

### The result object

The result object has the following properties.

| Property | Type | Description | Initial value |
| --- | --- | --- | --- |
| data | object | The data returned by the node. | null |
| error | object | The error returned by the node. | null |
| status | string | The status of the node. It can be `loading`, `loaded` or `error`. | `loading` |
| paginationID | string | The pagination ID of the node. | string |
| nodeRelationID | string | The relation ID of the node. | string |
| isLocal | boolean | If true, the result is from the cache. | false |

---

## Pagination in NodeRoom Client
### Some theory about pagination

Pagination is a technique to split the larger array into smaller chunks. Each chunk is called a page. The number of items in each page is called the page size. The page size is usually 10 or 20. 

NodeRoom uses result of `query node` as page. To identify and merge the multiple pages of given pagination to form single array, we use `paginationID`. The `paginationID` is a unique ID that is used to group the pages.

### How to use pagination in NodeRoom Client

```js
import { fetchNode } from "@noderoom/client";

const paginationID = "unique pagination ID";
const nodeName = "your node name";
const nodeArgs = {
    // your node arguments as key value pairs
};

const subscription = fetchNode(nodeName, nodeArgs , {
    paginationID: paginationID,
}).subscribe((result) =>{
    // your code to handle the result
});

// to load next page ( 2 )
const nodeArgs1 = {
    // your node arguments as key value pairs
};
fetchNode(nodeName, nodeArgs1 , {paginationID: paginationID});

// load next page ( 3 )
const nodeArgs2 = {
    // your node arguments as key value pairs
};
fetchNode(nodeName, nodeArgs2 , {paginationID: paginationID});

// load next page ( 4 )
const nodeArgs3 = {
    // your node arguments as key value pairs
};
fetchNode(nodeName, nodeArgs3 , {paginationID: paginationID});
```
