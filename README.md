# MindustryVCode
Small programming language for mindustry.

Code Example:
```
call main

func main
	x = 0
	call doSomething
	if x > 4
		cmd draw clear 255 0 0
		cmd drawflush display1
	end
end

func doSomething
	while x < 5
		x = x + 1
	end
end


```
