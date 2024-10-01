

const ageData = [];

// const rowCount = res.numRows;

const nameColumn = res.getChildAt(0);

const entries = nameColumn.toArray().entries();

for (const entry in entries) {
  console.log(entry);
}

// const ageColumn = res.getChildAt(1);

// for (const [index] of nameColumn.toArray().entries()) {
//   const name = nameColumn.get(index);
//   const age = ageColumn.get(index);
//   ageData.push({ name, age });
// }

// for (const batch of res.batches) {
//   console.log("batch", batch);
//   for (const column of batch.getChildAt(0)) {
//     const rowData = column.toJSON();

//     ageData.push(rowData);
//     // if (rowData && rowData.length === 2) {
//     // ageData.push({ name: rowData[0], age: rowData[1] });
//     // }
//   }
// }

// console.log("Extracted Age data:", ageData);

// for (const batch of res.batches) {
//   console.log("query res", batch);
// }