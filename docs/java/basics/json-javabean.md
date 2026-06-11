---
title: Json字符串属性名和JavaBean中的属性名匹配
date: 2022-09-06
---

目的：都是为了解决json字符串的某些属性名和JavaBean中的属性名匹配不上的问题。

# 默认的JSON解析框架 jackson

1. JsonProperty是位于jackson包里面，搭配`ObjectMapper().writeValueAsString(实体类)`方法使用，将实体类转换成字符串。

搭配`ObjectMapper().readValue(字符串)`方法使用，将字符串转换成实体类。

```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>版本号</version>
</dependency>
```


测试例子：

实体类：User.java

```java
import com.fasterxml.jackson.annotation.JsonProperty;

public class User {
	@JsonProperty("JsonPropertyName")
	private String name;
	private String sex;
	private Integer age;

	public String getName() {
		return name;
	}
	 
	public void setName(String name) {
		this.name = name;
	}
	 
	public String getSex() {
		return sex;
	}
	 
	public void setSex(String sex) {
		this.sex = sex;
	}
	 
	public Integer getAge() {
		return age;
	}
	 
	public void setAge(Integer age) {
		this.age = age;
	}
	 
	public User(String name, String sex, Integer age) {
		super();
		this.name = name;
		this.sex = sex;
		this.age = age;
	}
	 
	public User() {
		super();
	}
	 
	@Override
	public String toString() {
		return "User [name=" + name + ", sex=" + sex + ", age=" + age + "]";
	}

}
```

测试方法：

```java
@Test
	public void testJsonProperty() throws IOException{
		User user=new User("shiyu","man",22);
		System.out.println(new ObjectMapper().writeValueAsString(user));
		String str="{\"sex\":\"man\",\"age\":22,\"JsonPropertyName\":\"shiyu\"}";
		System.out.println(new ObjectMapper().readValue(str, User.class).toString());
	}
```

输出结果：

```xml
{"sex":"man","age":22,"JsonPropertyName":"shiyu"}
User [name=shiyu, sex=man, age=22]
```

2. JSONField是位于fastjson包里面，搭配`JSON.toJSONString(实体类)`方法使用，将实体类转换成json字符串。搭配`JSON.parseObject(字符串,实体类.class)`方法使用，将字符串转换成实体类。

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>版本号</version>
</dependency>
```

测试例子：

实体类：User.java

```java
import com.alibaba.fastjson.annotation.JSONField;

public class User {
	@JSONField(name="JSONFieldName")
	private String name;
	private String sex;
	private Integer age;

	public String getName() {
		return name;
	}
	 
	public void setName(String name) {
		this.name = name;
	}
	 
	public String getSex() {
		return sex;
	}
	 
	public void setSex(String sex) {
		this.sex = sex;
	}
	 
	public Integer getAge() {
		return age;
	}
	 
	public void setAge(Integer age) {
		this.age = age;
	}
	 
	public User(String name, String sex, Integer age) {
		super();
		this.name = name;
		this.sex = sex;
		this.age = age;
	}
	 
	public User() {
		super();
	}
	 
	@Override
	public String toString() {
		return "User [name=" + name + ", sex=" + sex + ", age=" + age + "]";
	}

}
```


测试方法：

```java
@Test
public void testSONField(){
	User user=new User("shiyu","man",22);
	System.out.println(JSON.toJSONString(user));
	String str="{\"JSONFieldName\":\"shiyu\",\"age\":22,\"sex\":\"man\"}";
	System.out.println(JSON.parseObject(str, User.class).toString());	
}
```
输出结果：

```bash
{"JSONFieldName":"shiyu","age":22,"sex":"man"}
User [name=shiyu, sex=man, age=22]
```

# alibaba的[fastjson](https://so.csdn.net/so/search?q=fastjson&spm=1001.2101.3001.7020)

接收请求时json转实体类用的`@JsonProperty`，返回响应时实体类转json返回时用`@JSONField`

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/20210429104717140.png)
