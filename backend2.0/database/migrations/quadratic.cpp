#include <iostream>

#include <cmath>

using namespace std;



double getx1 (double a, double b, double c){

    return (-b + sqrt ((b*b)- ( 4 * a * c)))/ (2*a);
}


double getx2 (double a, double b, double c){

    return (-b - sqrt((b*b)-(4 * a * c))) / (2*a);
}
int main(){

    double a, b, c;

    cout <<"Enter a"<<endl;

    cin>>a;

    cout<<"Enter b"<<endl;

    cin>>b;

    cout<<"Enter c"<<endl;

    cin>>c;

    double x1 = getx1(a,b,c);

    double x2 = getx2(a,b,c);

    cout<<x1<<"\n"<<x2;

    return 0;




}