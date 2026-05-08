---
paths:
  - "src/*.js"
---

# 对于当前项目的H0内置函数

## 新增单条业务对象记录
### 描述
可根据传入的业务对象及数据新增单条该业务对象的记录
### 参数
1. 租户(tenantId)
2. 业务对象(objectCode)
3. 记录(record)
4. 忽略业务规则校验(ignoreBusinessRuleCheckFlag)
### 示例
```js
function process(){
  const tenantId = CORE.CurrentContext.getTenantId();
  const objectCode = "YXtes_003";
  const record = {"xx01": "002", "xx02": 16, "tenantId": 0};
  let res = H0.ModelerHelper.insert(objectCode, tenantId, record, false);
  return res;
}
```
### 示例返回
```json
{
	"xx01": "002",
	"xx02": 16,
	"tenantId": 0,
	"id": "240787318253854720",
	"objectVersionNumber": 1
}
```

## 新增多条业务对象记录
### 描述
可根据传入的业务对象及数据新增多条该业务对象的记录
### 参数
1. 租户(tenantId)
2. 业务对象(objectCode)
3. 记录(records)
4. 忽略业务规则校验(ignoreBusinessRuleCheckFlag)
### 示例
```js
function process() {
	const tenantId = 0;
	const objectCode = "YXtes_003";
	const records = [{
			"xx01": "003",
			"xx02": 17,
			"tenantId": 0
		},
		{
			"xx01": "004",
			"xx02": 18,
			"tenantId": 0
		}
	];
	let res = H0.ModelerHelper.batchInsert(objectCode, tenantId, records, false);
	return res;
}
```
### 示例返回
```json
[{
	"xx01": "003",
	"xx02": 17,
	"tenantId": 0,
	"id": "240785901556375552",
	"objectVersionNumber": 1
}, {
	"xx01": "004",
	"xx02": 18,
	"tenantId": 0,
	"id": "240785901602512896",
	"objectVersionNumber": 1,
	"tenantid": 0
}]
```

## 更新单条业务对象记录
### 描述
可根据传入的业务对象及数据更新单条该业务对象的记录
### 参数
1. 租户(tenantId)
2. 业务对象(objectCode)
3. 记录(record)
4. 忽略业务规则校验(ignoreBusinessRuleCheckFlag)
### 示例
```js
//need to pass in the primary key and objectVersionNumber to update
function process(){
  const tenantId = 0;
  const objectCode = "YXtes_003";
  const record = {"id": 240788155109777408, "xx02": 38, "objectVersionNumber": 1};
  let res = H0.ModelerHelper.updateByPrimaryKey(objectCode, tenantId, record, false);
  return res;
}
```
### 示例返回
```json
{
	"id": 240788155109777400,
	"xx02": 38,
	"objectVersionNumber": 2
}
```

## 更新多条业务对象记录
### 描述
可根据传入的业务对象及数据更新多条该业务对象的记录
### 参数
1. 租户(tenantId)
2. 业务对象(objectCode)
3. 记录(records)
4. 忽略业务规则校验(ignoreBusinessRuleCheckFlag)
### 示例
```js
function process(input) {
  //Update based on primary key and version number
  const records = [{
    "objectVersionNumber": 5,
    "stuSex": "nan",
    "stuHeight": 180.0,
    "stuName": "aaaaaa",
    "stuTrait": "a",
    "tenantId": 0,
    "id": "=WKfHHVQA3EIW9LU-bXOhzxnrKs5OFCmVlVq8g332hrI==",
    "class": "二班",
    "stuAge": "123"
  }, {
    "objectVersionNumber": 2,
    "stuSex": "aaa",
    "stuHeight": 170.0,
    "stuName": "test00CCC",
    "stuTrait": "okkk",
    "tenantId": 0,
    "id": "=hDJAfJDTQ3wRO-yoEDFIiQpBKdjyhvbElnYk421GEq0==",
    "class": "三班",
    "stuAge": "18"
  }];
  return H0.ModelerHelper.batchUpdateByPrimaryKey("xlp_student", 0, records, false);
  
  //Conditional update，Update conditions into __conditions
  let updateDatas = [{
    "supplyName": "上海汉得",
    "amount": 1000,
    "__conditions": {
      "contractNum": "S_TEST_1_0531_01"
    }
  }];
  return H0.ModelerHelper.batchUpdateByPrimaryKey("GTEST_CONTRACT", 0, updateDatas, false);
}
```
### 示例返回
```json
[{
	"objectVersionNumber": "6",
	"stuSex": "nan",
	"stuHeight": "180",
	"stuName": "aaaaaa",
	"stuTrait": "a",
	"tenantId": "0",
	"id": "=WKfHHVQA3EIW9LU-bXOhzxnrKs5OFCmVlVq8g332hrI==",
	"class": "二班",
	"stuAge": "123"
}, {
	"objectVersionNumber": "3",
	"stuSex": "aaa",
	"stuHeight": "170",
	"stuName": "test00CCC",
	"stuTrait": "okkk",
	"tenantId": "0",
	"id": "=hDJAfJDTQ3wRO-yoEDFIiQpBKdjyhvbElnYk421GEq0==",
	"class": "三班",
	"stuAge": "18"
}]
```

## 查询单条数据
### 描述
可根据传入的查询SQL查询单条数据（实际查询超出一条时，将会报错）
### 参数
1. 服务(serverId)
2. SQL(sql)
3. SQL中的参数集(queryParamMap)
### 示例
```js
//example 1: variable
function process(){
    const serviceId = "HZERO-MODELER";
    const sql = `select xx01, xx02 from yxtes_003 where xx01 = #{x1}`;
    const queryParamMap = {"x1": "001"};
    let res = H0.SqlHelper.selectOne(serviceId, sql, queryParamMap);
    return res;
 }
```
### 示例返回
```json
{
	"xx01": "001",
	"xx02": 32
}
```

## 查询多条数据
### 描述
可根据传入的查询SQL查询多条数据
### 参数
1. 服务(serverId)
2. SQL(sql)
3. SQL中的参数集(queryParamMap)
### 示例
```js
//example 1: variable
function process(){
    const serviceId = "HZERO-MODELER";
    const sql = `select xx01, xx02 from yxtes_003 where xx01 like #{xx01}`;
    const queryParamMap = {"xx01": "%低代码%"};
    let res = H0.SqlHelper.selectList(serviceId, sql, queryParamMap);
    return res;
 }
```
### 示例返回
```json
	[{
		"xx01": "低代码大学",
		"xx02": "1"
	}, {
		"xx01": "低代码中学",
		"xx02": "2"
	}, {
		"xx01": "低代码小学",
		"xx02": "3"
	}]
```

## 删除单条业务对象记录
### 描述
可根据传入的业务对象及数据删除单条该业务对象的记录
### 参数
1. 租户(tenantId)
2. 业务对象(objectCode)
3. 记录(record)
### 示例
```js
function process(){
    const tenantId = 0;
    const objectCode = "YXtes_003";
    const record = {"id": 240787318253854720, "xx01": "001", "objectVersionNumber": 2};
    H0.ModelerHelper.deleteByPrimaryKey(objectCode, tenantId, record);
}
```
### 示例返回
```json
null;成功删除了数据
```

## 删除多条业务对象记录
### 描述
可根据传入的业务对象及数据删除多条该业务对象的记录
### 参数
1. 租户(tenantId)
2. 业务对象(objectCode)
3. 记录(records)
### 示例
```js
function process() {
  //delete based on primary key and objectVersionNumber
  const ids = [{
    "id": '423859236396908544'
  }, {
    "id": '415560474355699718'
  }];
  H0.ModelerHelper.batchDeleteByPrimaryKey('GTEST_CONTRACT', CORE.CurrentContext.getTenantId(), ids);

  //delete data conditionally
  const whereParam = [{
    "contractName$2": "测试用合同",
    "contractName$2@query-type": "EQUAL",
    "contractNum$1": "TEST001",
    "contractNum$1@query-type": "EQUAL",
    "@query-formula": "contractNum$1 AND contractName$2"
  }]
  H0.ModelerHelper.batchDeleteByPrimaryKey('GTEST_CONTRACT', CORE.CurrentContext.getTenantId(), whereParam);
}
```
### 示例返回
```json
null;成功删除了数据
```

## 抛出异常
### 描述
此方法调用后可抛出多语言异常信息
### 参数
1. 多语言返回消息(code)
2. 参数(...arr)
### 示例
```js
function process(input){
  H0.ExceptionHelper.throwCommonException("get.employee.error", 123)
}
```
### 示例返回
```json
["根据当前租户获取员工失败，租户ID为123"]
```