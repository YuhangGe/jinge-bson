# BSON(for jinge) 语法规范 v1.0

BSON 的基本构成为“元素（element，简写为 el）”，元素可以递归地进行组合。每个元素都由一个 byte 的元素头（el_head）开始，紧接着是 N 个 bytes 构成的元素内容（el_body），其中，N 可以为 `0`。

元素头的 byte 由 8 个 bits 构成，拆分为左右两部分。左边 4 个 bits 组成的无符号整数（0 ~ 15）代表元素的类型（el\_type）。右边的 4 个 bits 代表该元素的属性（el\_tag），其中 4 个 bits 在不同的元素类型下会有特定的含义。

接下来，我们按类型介绍所有的 BSON 元素。

## 微小元素（micro）

元素头：

````bnf
el_type ::= 0
el_tag ::= [2]small_value [2]small_type
small_type ::= 0 | 1 | 2 | 3  // 0 代表布尔类型，1 代表空类型，2 代表正的小整数，3代表负的小整数
small_value ::= 0 | 1 | 2 | 3
````

其中：

* 当 `small_type` 为 0 时代表布尔类型，`small_value = 0` 代表 False，`small_value = 1` 代表 True；
* 当 `small_type` 为 1 时代表空类型，`small_value = 0` 代表 Undefined，`small_value = 1` 代表 Null；
* 当 `small_type` 为 2 时代表正的小整数，`small_value` 就代表整数值。
* 当 `small_type` 为 3 时代表负的小整数，`small_value` 就代表负数的绝对值。


该类型没有元素内容。


## 整数元素（integer）

元素头：

````bnf
el_type := 1
el_tag := [3]int_size [1]int_negative 
int_size := 0 | 1 | 2 | 3 | 7
int_negative := 0 | 1             // 是否是负数，0 代表正数，1 代表负数。
````

元素内容：

el\_tag 里 `int\_size + 1` 个 bytes，填充该元素的值的**绝对值** 的  unsigned-big-endian 格式的数据。注意，负数也要先转成绝对值后再存储。

`int_size` 可以是 0, 1, 2, 3, 7，但不支持 4, 5, 6。因为如果要支持 40, 48, 56 这三种位数的整数，需要自己实现序列化（而 8, 16, 32, 64 都是 js 语言原生支持的），但超过 32 位整数的情况很少，因此不需要为了节省空间引入太过于复杂的处理。`int_size` 可以是 2，即支持 24 bits 的整数，是因为这一类的整数出现的可能性比较大，值得额外处理以节省空间。

`补充：`

当整数的长度为 3 个 bytes 时，实际代表 4 个 bytes 里最左边的 byte 为 0。因此需要使用 big-endian 格式来存储整数。本文档所有存储整数时都按这个约定执行，不再赘述。



## 浮点数元素（float）

元素头：

````bnf
el_type := 2
el_tag := [3] [1]float_long 
float_long := 0 | 1             // 1 代表是 8 个 bytes 的 double 型浮点数，0 代表是 4 个 bytes 的 float 型浮点数。
````

元素内容：

el\_tag 里 float\_long 指定数量的 bytes，填充该元素的值的  big-endian 格式的数据。

## 字符串元素（string）

元素头：

````bnf
el_type := 3
el_tag := [2]str_len_idx_size [2]str_type 
str_in_dict := 0 | 1 | 2             // 0 代表普通字符串，1 代表是在字典表里的字符串，2 代表微型字符串，3 代表空字符串
str_len_idx_size := 0 | 1 | 2 | 3
````

元素内容：

当 `str_type = 0` 的时候，`str_len_idx_size + 1` 代表字符串的长度对应整数的 bytes 大小。元素内容前 `str_len_idx_size + 1` 个 bytes 为字符串长度，紧接着是由该长度指定的 utf-8 编码的字符串 bytes 流。

当 `str_type = 1` 的时候，`str_len_idx_size + 1` 代表字符串在字典里的索引对应整数的 bytes 大小。元素内容即这个索引对应整数的 bytes 数据。

当 `str_type = 2` 的时候，`str_len_idx_size + 1` 代表字符串的长度（1 - 4）。元素内容是这么长的字符串的 utf-8 编码流。

当 `str_type = 3` 的时候，代表空字符串。此时该元素没有元素内容。


## 数组元素（array）

元素头：

````bnf
el_type := 4
el_tag :=  [1]array_is_same [2]array_len_size [1]array_is_micro
array_is_same := 0 | 1    // 数组里面的元素是否全部是相同的类型
array_is_micro := 0 | 1    // 是否是迷你数组
array_len_size := 0 | 1 | 2 | 3 // 数组的长度对应的整数的大小 - 1
````

元素内容：

当 `array_is_micro ` 为 `1` 时，代表迷你数组，`array_len_size ` 构成的整数（0～3）代表数组的长度。这时候，元素内容为连续的对应个数的除字典表外的任意 BSON 元素。如果长度为 0 ，代表空数组。

当 `array_is_micro ` 为 `0` 时，元素内容的前 `array_len_size + 1` 个 bytes 是对象的数组的长度对应的整数的大小。在这之后，是连续的除字典表外的任意 BSON 元素，总的个数由前面读到的数据指定。

需要注意的是，当 `array_is_same` 为 1 时，代表数组的项目（item）全部相同，即数组满足以下两个规则之一（或的关系）：

1. 数组里面所有项目（item）的类型一致，都是`布尔`、`小整数`、`整数`、`浮点数`、`字符串`、`空` 这几个基础类型之一，且所有项目的值相同。
2. 数组里面所有项目（item）的类型都是`对象`，且所有对象的属性完全相同（相同名称，相同数量）；相同的属性名对应的属性值的类型相同；任意一个属性的值的类型都是上述提到的基础类型。

当 `array_is_same` 为 1 时，解析数组元素时，如果读到的第一个元素是基础类型，则直接重复元素以构造数组。如果读到的第一个元素是对象类型，那么读完该对象元素后，后面的紧跟的，是剩下对象元素的属性值的直接排布，排布顺序为按其对应的属性名从小到大排序后。

`array_is_same` 这个标志位的设计，用于极大限度地压缩诸如 `[0, 0, 0, 0, 0, 0]` 这样的数组，或者 `[{width: 10, height: 20}, {width: 100, height: 300}]` 这样的数组。


## 对象元素（object）

元素头：

````bnf
el_type := 5
el_tag := [1] [2]obj_prop_size [1]obj_is_micro 
````

元素内容：

当 `obj_is_micro ` 为 `1` 时，代表迷你对象，`el_tag` 的左边 3 个 bits 构成的整数（0～7）代表对象的属性（property）的个数。这时候，元素内容为相应个数的连续 property value 组合，其中，property 是字符串元素，value 是除字典表外的任意 BSON 元素。如果属性个数为 0，说明 是空对象。

当 `obj_is_micro` 为 `0` 时，元素内容的前 `obj_prop_size + 1` 个 bytes 是对象的属性数量对应的整数的大小。在这之后，是连续的 property value 组合，总的个数由前面读到的数据指定。

## 字典表（dict）

元素头：

````bnf
el_type := 6
el_tag := [1] [2]dict_len_size [1]dict_is_micro
        | [3]dict_len [1]dict_is_micro
dict_is_micro := 0 | 1    // 是否是迷你字典表
dict_size := 0 | 1 | 2 | 3 // 字典表的元素数量的
````

元素内容：

当 `dict_is_micro` 为 `1` 时，代表迷你字典表，左边 3 个 bits `dict_len + 1` 代表字典表里面字符串的个数（1～8，字典项个数不可能为 0）。这时候，元素内容为相应个数的字典项。

当 `dict_is_micro` 为 `0` 时，元素内容的前 `dict_len_size + 1` 个 bytes 是字典表里面字符串个数的数据。在这之后，是连续的字典项，总的个数由前面读到的数据指定。

字典项：

字典项是一种简化类型的字符串。其第一个 byte 的左边第一个 bit 代表字符串长度是 7 个 bits 还是 15 个 bits，如果是 15 个则接下来的一个 byte 也一起读取，获得字符串长度。然后读取这个长度的 bytes 流。

`补充：`

跟 JSON 一样，一个 BSON 文档限定有且只有一个元素（通常都是 object 或 array 类型）。但为了引入字典表，对 BSON 进行了扩展：BSON 文档里，字典表元素最多出现一次，且必须出现在文档的头部；如果头部是字典表元素，则其后一定需要再紧邻一个其它元素；如果头部不是字典表元素，则 BSON 文档限定有且只能有一个非字典表元素。
