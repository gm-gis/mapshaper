var api = require('../'),
    assert = require('assert'),
    DataTable = api.internal.DataTable;

function stringifyEqual(a, b) {
  assert.equal(JSON.stringify(a), JSON.stringify(b));
}

function fixPath(p) {
  return require('path').join(__dirname, p);
}

describe('mapshaper-join.js', function () {
  describe('joinAttributesToFeatures()', function () {
    it('apply filter expression', function () {
      var targetRecords = [{STATE: 'CA'}, {STATE: "NV"}];
      var sourceRecords = [
        {ST: 'CA', YEAR: '2000', CASES: 32},
        {ST: 'CA', YEAR: '2005', CASES: 12},
        {ST: 'CA', YEAR: '2010', CASES: 3},
        {ST: 'NV', YEAR: '2000', CASES: 2},
        {ST: 'NV', YEAR: '2005', CASES: 54},
        {ST: 'NV', YEAR: '2010', CASES: 0}
      ];
      var lyr = {
        geometry_type: null,
        data: new api.internal.DataTable(targetRecords)
      };
      var opts = {
        where: "YEAR=='2005'",
        fields: ["CASES"],
        keys: ["STATE", "ST"]
      };
      api.joinAttributesToFeatures(lyr, new api.internal.DataTable(sourceRecords), opts);
      assert.deepEqual(lyr.data.getRecords(),
          [{ STATE: "CA", CASES: 12}, {STATE: "NV", CASES: 54}]);
    })

    it('Issue #67 -- join shouldn\'t convert 0 values to null', function () {
      var targetRecords = [{key1: 1}, {key1: 0}];
      var sourceRecords = [{key2: 1, foo: 0}, {key2: 0, foo: 1}];
      var lyr = {
        geometry_type: null,
        data: new api.internal.DataTable(targetRecords)
      };
      var opts = {
        keys: ["key1", "key2"]
      };
      api.joinAttributesToFeatures(lyr, new api.internal.DataTable(sourceRecords), opts);
      assert.deepEqual(lyr.data.getRecords(),
          [{ key1: 1, foo: 0}, { key1: 0, foo: 1 }]);
    })

    it('Missing values in source table are converted to null', function () {
      var targetRecords = [{key1: 1}, {key1: 0}];
      var sourceRecords = [{key2: 1, foo: 0}, {key2: 0}];
      var lyr = {
        geometry_type: null,
        data: new api.internal.DataTable(targetRecords)
      };
      var opts = {
        keys: ["key1", "key2"]
      };
      api.joinAttributesToFeatures(lyr, new api.internal.DataTable(sourceRecords), opts);
      assert.deepEqual(lyr.data.getRecords(),
          [{ key1: 1, foo: 0}, { key1: 0, foo: null }]);
    })

  })

  describe('importJoinTable()', function() {
    it('should not adjust types of dbf table fields', function() {
      var opts = {
        keys: ['STFIPS', 'FIPS']
      };
      var table = api.importJoinTable(fixPath("test_data/two_states.dbf"), opts);
      assert.strictEqual(table.getRecords()[0].FIPS, '41')
    })

    it('should adjust types of csv table fields', function() {
      var opts = {
        keys: ['STFIPS', 'FIPS']
      };
      var table = api.importJoinTable(fixPath("test_data/two_states.csv"), opts);
      assert.strictEqual(table.getRecords()[0].FIPS, 41)
    })

    it('should accept type hints for csv table fields', function() {
      var opts = {
        fields: ['LAT:str'],
        keys: ['STFIPS', 'FIPS:str']
      };
      var table = api.importJoinTable(fixPath("test_data/two_states.csv"), opts);
      assert.strictEqual(table.getRecords()[0].FIPS, '41')
      assert.strictEqual(table.getRecords()[0].LAT, '43.94')
    })

  })

  describe('joinTables()', function () {
    it('one-to-several mapping', function () {
      var table1 = new DataTable([{foo: 5, bar: 'a'}, {foo: 5, bar: 'b'}]),
          table2 = new DataTable([{shmoo: 5, baz: 'pumpkin'}]);
      api.internal.joinTables(table1, 'foo', ['baz'], table2, 'shmoo', ['baz']);
      assert.deepEqual(table1.getRecords(), [{foo: 5, bar: 'a', baz: 'pumpkin'},
            {foo: 5, bar: 'b', baz: 'pumpkin'}]);
    })

    it('missing values are joined as null', function () {
      var table1 = new DataTable([{foo: 5, bar: 'a'}, {foo: 3, bar: 'b'}]),
          table2 = new DataTable([{shmoo: 5, baz: 'pumpkin'}]);

      api.internal.joinTables(table1, 'foo', ['baz'], table2, 'shmoo', ['baz']);
      assert.deepEqual(table1.getRecords(), [{foo: 5, bar: 'a', baz: 'pumpkin'},
            {foo: 3, bar: 'b', baz: null}]);
    })

  })
})