import assert from 'node:assert/strict';
const origin = process.env.WBOOK_ORIGIN || 'http://127.0.0.1:5173';
const document = {title:'Проверка общей библиотеки',author:'WBook',paragraphs:['Это проверка загрузки книги в общую библиотеку.', 'У каждого читателя сохраняется собственное место.']};
async function upload() {
  const form = new FormData();
  form.append('file', new File([document.paragraphs.join('\n\n')], 'Проверка.txt', {type:'text/plain'}));
  form.append('document', JSON.stringify(document));
  const response = await fetch(origin + '/api/books', {method:'POST', body:form});
  const data = await response.json();
  assert.ok(response.ok, JSON.stringify(data));
  return data;
}
const first = await upload();
const second = await upload();
assert.equal(first.book.id, second.book.id);
assert.equal(second.duplicate, true);
const list = await (await fetch(origin + '/api/books', {headers:{'Cookie':'independent-session=second'}})).json();
assert.equal(list.books.filter(b => b.id === first.book.id).length, 1);
const opened = await (await fetch(origin + '/api/books/' + first.book.id)).json();
assert.deepEqual(opened.document.paragraphs, document.paragraphs);
assert.equal((await fetch(origin + '/api/books/not-an-id')).status, 404);
console.log('PASS: import → shared catalogue in a second session → full text; duplicate deduplication; invalid id 404');
