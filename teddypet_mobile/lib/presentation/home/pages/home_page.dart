import 'package:flutter/material.dart';
import 'package:teddypet_mobile/presentation/home/widgets/main_header.dart';

import '../widgets/hero_section.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
   return Scaffold(
     backgroundColor: Colors.white,

     appBar: MainHeader(),

     body: SingleChildScrollView( // Cho phép cuộn nếu nội dung vượt quá màn hình thì cuộn dọc
       child: Column(
         children: [
           // const HeroSection(),
         ],


       ),
     ),
   );
  }
}
