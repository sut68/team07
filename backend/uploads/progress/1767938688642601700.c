#include <stdio.h>
#include <string.h>

void factorial(int x,int *y);

void main() 
{
    int in;
    int tem = 1;
    int *ans = &tem;

    printf("put your data : ");
    scanf("%d",&in);

    factorial(in,ans);
    printf("answer is : %d",*ans);
}

void factorial(int x,int *y)
{
    if (x != 0)
    {
        *y = *y*x;
        x-=1;
        factorial(x,y);
    }

}
